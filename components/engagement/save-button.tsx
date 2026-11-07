"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";

import { toggleSavedAction } from "@/lib/actions/engagement";

export function SaveButton({
  listingId,
  initialSaved,
}: {
  listingId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleSavedAction(listingId);
          if ("needsLogin" in res) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          setSaved(res.saved);
        })
      }
      className={
        "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors disabled:opacity-60 " +
        (saved
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/40")
      }
    >
      <Bookmark className={"size-4 " + (saved ? "fill-current" : "")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
