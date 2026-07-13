"use client";

import { useState } from "react";
import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "@/lib/actions/auth";
import { PasswordRequirements } from "@/components/auth/password-requirements";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, null);
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthMessage error={state?.error} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordRequirements password={password} />
      </div>
      <SubmitButton className="w-full" pendingLabel="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
