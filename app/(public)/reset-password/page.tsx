import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

import { ResetForm } from "./reset-form";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll email you a link to set a new password.
          </p>
        </div>
        <ResetForm />
      </Card>
    </div>
  );
}
