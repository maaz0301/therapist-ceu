import { ButtonLink } from "@/components/ui/button-link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-8 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink variant="outline" href="/directory">
          Browse trainings
        </ButtonLink>
      </div>
    </div>
  );
}
