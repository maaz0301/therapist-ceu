import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { AlertCircle } from "lucide-react";

export const metadata = { title: "Account Suspended" };

export default function SuspendedPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-8 border-destructive/20 bg-destructive/5 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Account Suspended
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Your trainer account has been suspended by an administrator.
          All your active listings have been temporarily removed from the directory.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          If you believe this is an error or wish to reactivate your account, please contact our support team.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
