"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { profiles } from "@/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/send";

export type AuthActionState = {
  error?: string;
  success?: string;
} | null;

const emailSchema = z.string().trim().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

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

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: error.message };

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
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/dashboard`,
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
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${env.appUrl}/auth/callback?next=/update-password`,
  });

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
