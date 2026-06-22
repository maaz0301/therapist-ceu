import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CeuBadge({
  ceCount,
  className,
}: {
  /** Number of CE credits offered, if known. */
  ceCount?: number | null;
  className?: string;
}) {
  return (
    <Badge className={cn("bg-success/12 text-success", className)}>
      <GraduationCap data-icon="inline-start" />
      {ceCount ? `${ceCount} CE${ceCount === 1 ? "" : "s"}` : "CEU"}
    </Badge>
  );
}
