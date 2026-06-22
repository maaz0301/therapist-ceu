import { Monitor, MapPin, PlayCircle, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingFormat } from "@/lib/constants";

const FORMAT_STYLES: Record<
  ListingFormat,
  { className: string; Icon: typeof Monitor }
> = {
  "Live Virtual": {
    className: "bg-secondary text-secondary-foreground",
    Icon: Monitor,
  },
  "In-Person": {
    className: "bg-coral/12 text-coral",
    Icon: MapPin,
  },
  "Self-Paced": {
    className: "bg-warning/12 text-warning",
    Icon: PlayCircle,
  },
  Hybrid: {
    className: "bg-muted text-muted-foreground",
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
