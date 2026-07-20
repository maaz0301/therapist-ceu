"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { US_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATES = US_STATES.filter((s) => s.code !== "ONLINE");

export function StateMultiselect({
  defaultSelected,
  error,
  onSelectionChange,
}: {
  defaultSelected: string[];
  error?: string;
  /** Fired on every toggle so the parent can clear a stale server error. */
  onSelectionChange?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code],
    );
    onSelectionChange?.();
  }

  return (
    <div className="space-y-2">
      {selected.map((code) => (
        <input key={code} type="hidden" name="states" value={code} />
      ))}
      <div
        className={cn(
          "max-h-56 overflow-y-auto rounded-lg border border-border p-3",
          error && "border-destructive",
        )}
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {STATES.map((state) => (
            <label
              key={state.code}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(state.code)}
                onCheckedChange={() => toggle(state.code)}
              />
              <span className="truncate">{state.name}</span>
            </label>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
