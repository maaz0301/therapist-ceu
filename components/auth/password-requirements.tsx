"use client";

import { Check, Circle } from "lucide-react";

export function PasswordRequirements({ password = "" }: { password?: string }) {
  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "At least 1 uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "At least 1 lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "At least 1 digit",
      met: /\d/.test(password),
    },
    {
      label: "At least 1 special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="mt-2 space-y-1.5 rounded-lg border border-border/50 bg-secondary/20 p-3">
      <p className="text-xs font-semibold text-foreground">Password requirements:</p>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-xs">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={`flex items-center gap-1.5 transition-colors ${
              req.met ? "text-primary font-medium" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="size-3.5 shrink-0 text-primary" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground/45 fill-muted-foreground/10" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
