import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

import { UpdatePasswordForm } from "./update-form";

export const metadata = { title: "Set a new password" };

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>
        <UpdatePasswordForm />
      </Card>
    </div>
  );
}
