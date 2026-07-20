import { Monitor, MapPin, PlayCircle, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingFormat } from "@/lib/constants";

const FORMAT_STYLES: Record<
  ListingFormat,
  { className: string; Icon: typeof Monitor }
> = {
  "Live Virtual": {
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
    Icon: Monitor,
  },
  "In-Person": {
    className: "bg-clay text-clay-foreground hover:bg-clay/90",
    Icon: MapPin,
  },
  "On-Demand": {
    className: "bg-warning text-warning-foreground hover:bg-warning/90",
    Icon: PlayCircle,
  },
  Hybrid: {
    className: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    Icon: Layers,
  },
};

export function FormatBadge({
  format,
  className,
}: {
  format: ListingFormat;
  className?: string;
}) {
  const { className: variantClass, Icon } = FORMAT_STYLES[format];
  return (
    <Badge className={cn(variantClass, className)}>
      <Icon data-icon="inline-start" />
      {format}
    </Badge>
  );
}
