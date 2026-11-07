"use client";

import { useActionState } from "react";
import { BellPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createAlertAction, type EngagementState } from "@/lib/actions/engagement";

export function AlertForm() {
  const [state, action, pending] = useActionState<EngagementState, FormData>(
    createAlertAction,
    null,
  );
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="query"
          required
          minLength={2}
          maxLength={80}
          aria-label="Alert keywords"
          placeholder="Keywords, e.g. leadership, python, ethics"
          className="h-10 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="clay" disabled={pending}>
          <BellPlus data-icon="inline-start" />
          Add alert
        </Button>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
    </form>
  );
}
