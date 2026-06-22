import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
