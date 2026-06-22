import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Listing } from "@/db/schema";

const STATUS_STYLES: Record<
  Listing["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending review",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  inactive: {
    label: "Inactive",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function ListingStatusBadge({
  status,
  active,
  className,
}: {
  status: Listing["status"];
  active?: boolean;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Badge variant="outline" className={style.className}>
        {style.label}
      </Badge>
      {status === "approved" && active === false ? (
        <Badge
          variant="outline"
          className="border-border bg-muted text-muted-foreground"
        >
          Unpublished
        </Badge>
      ) : null}
    </span>
  );
}
