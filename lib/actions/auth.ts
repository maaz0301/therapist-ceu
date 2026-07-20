"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { profiles } from "@/db/schema";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/send";

export type AuthActionState = {
  error?: string;
  success?: string;
  /**
   * Non-secret fields echoed back on failure. React resets an uncontrolled
   * form once its action resolves, so without these every field blanks out and
   * the user has to retype the whole form to fix one mistake. Passwords are
   * deliberately excluded — they are preserved client-side instead.
   */
  values?: { fullName?: string; email?: string };
} | null;

const emailSchema = z.string().trim().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/\d/, "Password must contain at least one digit.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

/** Where a profile should land after authenticating. */
async function destinationFor(userId: string): Promise<string> {
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile?.role === "admin" ? "/admin" : "/dashboard";
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Enter your password.") })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: error.message };

  if (data.user) {
    const [profile] = await db
      .select({ role: profiles.role, accountStatus: profiles.accountStatus })
      .from(profiles)
      .where(eq(profiles.id, data.user.id))
      .limit(1);

    if (
      profile &&
      profile.accountStatus === "suspended" &&
      profile.role !== "admin"
    ) {
      await supabase.auth.signOut();
      return {
        error: "Your account has been suspended. Please contact support.",
      };
    }
  }

  redirect(await destinationFor(data.user.id));
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Enter your full name."),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

  const submitted = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      values: submitted,
    };
  }

  const { fullName, email, password } = parsed.data;

  // Check if email already exists in auth.users
  const existingUser = await db.execute<{ id: string }>(
    sql`SELECT id FROM auth.users WHERE email = ${email} LIMIT 1`
  );

  if (existingUser.length > 0) {
    return {
      error: "An account with this email address already exists.",
      values: submitted,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await getBaseUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: error.message, values: submitted };

  // Profile row is created by the on_auth_user_created trigger; set the name.
  if (data.user) {
    await db
      .update(profiles)
      .set({ fullName })
      .where(eq(profiles.id, data.user.id));
  }

  await sendWelcomeEmail(email, fullName);

  // No session means email confirmation is required.
  if (!data.session) {
    return {
      success:
        "Almost there! Check your inbox to confirm your email, then log in.",
    };
  }

  redirect("/dashboard");
}

export async function signInWithMagicLinkAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${await getBaseUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: error.message };
  return { success: "Check your email for a magic login link." };
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await getBaseUrl()}/auth/callback?next=/update-password`,
  });

  // The response stays generic either way, so a delivery failure is otherwise
  // indistinguishable from success — log it rather than discarding it.
  if (error) {
    console.error("[requestPasswordReset] Supabase rejected the request:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
  }

  // Always report success to avoid leaking which emails are registered.
  return {
    success: "If an account exists for that email, we sent a reset link.",
  };
}

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
