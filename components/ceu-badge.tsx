import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CeuBadge({
  ceCount,
  className,
}: {
  /** Number of CE credits offered, if known. Numeric column, so a decimal string. */
  ceCount?: string | null;
  className?: string;
}) {
  return (
    <Badge className={cn("bg-clay text-clay-foreground hover:bg-clay/90", className)}>
      <GraduationCap data-icon="inline-start" />
      {ceCount ? `${Number(ceCount)} credit${Number(ceCount) === 1 ? "" : "s"}` : "Credits"}
    </Badge>
  );
}
