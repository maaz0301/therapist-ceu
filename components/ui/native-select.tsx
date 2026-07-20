import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * A native <select> styled to match Button/Input affordances — pointer cursor,
 * hover feedback, focus ring, and a real disabled state.
 *
 * Use this rather than a bare <select> with ad-hoc classes, so every dropdown
 * reads as interactive. For a fully custom listbox, use the Base UI `Select`
 * compound component in `./select` instead.
 */
const nativeSelectVariants = cva(
  "rounded-lg border border-input bg-transparent text-foreground outline-none transition-colors cursor-pointer hover:border-clay hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-transparent aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  {
    variants: {
      selectSize: {
        default: "h-9 px-2.5 text-sm",
        sm: "h-8 px-2.5 text-sm",
        xs: "h-8 px-2 text-sm",
      },
    },
    defaultVariants: {
      selectSize: "default",
    },
  },
);

export function NativeSelect({
  className,
  selectSize,
  ...props
}: ComponentProps<"select"> & VariantProps<typeof nativeSelectVariants>) {
  return (
    <select
      data-slot="native-select"
      className={cn(nativeSelectVariants({ selectSize }), className)}
      {...props}
    />
  );
}

export { nativeSelectVariants };
