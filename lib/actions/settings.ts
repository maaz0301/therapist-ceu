"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscriptionState } from "@/lib/subscription";

export type SettingsState = { error?: string; success?: string } | null;

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  credentials: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000, "Bio can be up to 1,000 characters.").optional(),
  websiteUrl: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Website must start with http:// or https://"),
});

export async function updateProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    credentials: formData.get("credentials") ?? "",
    bio: formData.get("bio") ?? "",
    websiteUrl: formData.get("websiteUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const d = parsed.data;
  await db
    .update(profiles)
    .set({
      fullName: d.fullName,
      credentials: d.credentials || null,
      bio: d.bio || null,
      websiteUrl: d.websiteUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Add at least one uppercase letter.")
      .regex(/[a-z]/, "Add at least one lowercase letter.")
      .regex(/\d/, "Add at least one digit.")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export async function changePasswordAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireUser();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: "Password updated." };
}

export async function updateNotificationsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  await db
    .update(profiles)
    .set({
      notifyAlerts: formData.get("notifyAlerts") === "on",
      notifyProduct: formData.get("notifyProduct") === "on",
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));
  revalidatePath("/settings");
  return { success: "Email preferences saved." };
}

/**
 * Permanently deletes the signed-in account and everything it owns. The user
 * must type DELETE, and an active subscription must be cancelled first so
 * nobody keeps being billed for an account that no longer exists.
 */
export async function deleteAccountAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile && getSubscriptionState(profile).isActive) {
    return { error: "Cancel your subscription in Billing before deleting your account." };
  }

  // Profile first: listings, saved courses, alerts and reviews cascade from it.
  await db.delete(profiles).where(eq(profiles.id, user.id));
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "Could not finish deleting your account. Please contact support." };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
