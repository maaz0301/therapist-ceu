"use client";

import { useActionState } from "react";
import Link from "next/link";

import { AuthMessage } from "@/components/auth/auth-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  signInAction,
  signInWithMagicLinkAction,
} from "@/lib/actions/auth";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [pwState, pwAction] = useActionState(signInAction, null);
  const [magicState, magicAction] = useActionState(
    signInWithMagicLinkAction,
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <AuthMessage error={pwState?.error ?? initialError} />

      <form action={pwAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton variant="clay" className="w-full" pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={magicAction} className="flex flex-col gap-3">
        <AuthMessage error={magicState?.error} success={magicState?.success} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="magic-email">Email me a magic link</Label>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <SubmitButton
          variant="outline"
          className="w-full"
          pendingLabel="Sending…"
        >
          Send magic link
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create a trainer account
        </Link>
      </p>
    </div>
  );
}
