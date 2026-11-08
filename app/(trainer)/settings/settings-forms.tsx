"use client";

import { useActionState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  changePasswordAction,
  deleteAccountAction,
  updateNotificationsAction,
  updateProfileAction,
  type SettingsState,
} from "@/lib/actions/settings";
import { cn } from "@/lib/utils";

function Status({ state }: { state: SettingsState }) {
  if (state?.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state?.success) return <p className="text-sm text-success">{state.success}</p>;
  return null;
}

export function ProfileForm({
  defaults,
}: {
  defaults: { fullName: string; credentials: string; bio: string; websiteUrl: string };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateProfileAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required defaultValue={defaults.fullName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="credentials">Title or credentials</Label>
          <Input
            id="credentials"
            name="credentials"
            placeholder="e.g. PMP, Senior Designer"
            defaultValue={defaults.credentials}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="websiteUrl">Website</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder="https://"
          defaultValue={defaults.websiteUrl}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">About you</Label>
        <Textarea id="bio" name="bio" rows={4} maxLength={1000} defaultValue={defaults.bio} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    changePasswordAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        At least 8 characters with upper and lower case, a digit and a symbol.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

const subscribe = () => () => {};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Laptop },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
      {options.map((o) => {
        const active = mounted && theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <o.icon className="size-5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function NotificationsForm({
  defaults,
}: {
  defaults: { notifyAlerts: boolean; notifyProduct: boolean };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateNotificationsAction,
    null,
  );
  const rows = [
    {
      name: "notifyAlerts",
      title: "Keyword alerts",
      text: "Email me when a new course matches one of my saved alerts.",
      on: defaults.notifyAlerts,
    },
    {
      name: "notifyProduct",
      title: "Product news",
      text: "Occasional updates about new Skillhive features.",
      on: defaults.notifyProduct,
    },
  ];
  return (
    <form action={action} className="space-y-4">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
            <Switch name={r.name} defaultChecked={r.on} aria-label={r.title} />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    deleteAccountAction,
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
        <Input id="confirm-delete" name="confirm" autoComplete="off" className="max-w-xs" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}
