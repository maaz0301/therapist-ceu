import { cn } from "@/lib/utils";

export function AuthMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  const message = error ?? success;
  if (!message) return null;

  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        error
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {message}
    </p>
  );
}
