"use client";

import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "@/lib/actions/auth";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthMessage error={state?.error} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      <SubmitButton className="w-full" pendingLabel="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
