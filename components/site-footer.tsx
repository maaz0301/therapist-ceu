import Link from "next/link";

import { Logo } from "@/components/logo";
import { getCurrentProfile } from "@/lib/auth";

const FOOTER_SECTIONS = [
  {
    title: "Therapists",
    links: [
      { href: "/directory", label: "Browse trainings" },
      { href: "/directory?ceu=Yes", label: "CEU trainings" },
      { href: "/directory?format=On-Demand", label: "On-demand" },
    ],
  },
  {
    title: "Trainers",
    links: [
      { href: "/signup", label: "List your training" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/login", label: "Trainer login" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export async function SiteFooter() {
  const profile = await getCurrentProfile();
  const trainerDashboardHref = profile?.role === "admin" ? "/admin" : "/dashboard";

  const sections = FOOTER_SECTIONS.map((section) => {
    if (section.title === "Trainers") {
      return {
        ...section,
        links: section.links.map((link) => {
          if (link.href === "/login") {
            return {
              href: profile ? trainerDashboardHref : "/login",
              label: profile ? "Trainer dashboard" : "Trainer login",
            };
          }
          return link;
        }),
      };
    }
    return section;
  });

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              The clean, modern directory of CEU and professional trainings for
              licensed mental health therapists.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} TherapistCEU.com LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
