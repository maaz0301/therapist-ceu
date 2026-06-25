import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="TherapistCEU"
        width={1080}
        height={440}
        priority
        className="h-16 w-auto"
      />
    </Link>
  );
}
