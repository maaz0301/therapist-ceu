import Link from "next/link";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={brand.name}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
        <path
          d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25z"
          className="fill-primary"
        />
        <path
          d="M10.5 16.2 14.6 20.3 22 12.4"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary-foreground"
        />
        <circle cx="23" cy="9" r="2.6" className="fill-clay" />
      </svg>
      <span className="font-heading text-xl font-bold tracking-tight">
        {brand.name}
      </span>
    </Link>
  );
}
