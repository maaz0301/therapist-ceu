import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to manage your trainings.
          </p>
        </div>
        <LoginForm initialError={error} />
      </Card>
    </div>
  );
}
