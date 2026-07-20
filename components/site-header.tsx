import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentProfile } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/directory", label: "Browse trainings" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-trainers", label: "For trainers" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const dashboardHref = profile?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <ButtonLink
              key={link.href}
              variant="ghost"
              size="sm"
              href={link.href}
            >
              {link.label}
            </ButtonLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <ButtonLink variant="clay" size="sm" href={dashboardHref}>
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                href="/login"
              >
                Log in
              </ButtonLink>
              <ButtonLink variant="clay" size="sm" href="/signup">
                List your training
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
