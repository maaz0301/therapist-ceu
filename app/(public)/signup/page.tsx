import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

import { SignupForm } from "./signup-form";

export const metadata = { title: "List your training" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Create your trainer account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            List your trainings and reach therapists searching for CEUs.
          </p>
        </div>
        <SignupForm />
      </Card>
    </div>
  );
}
