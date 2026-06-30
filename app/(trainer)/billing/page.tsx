import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { requireTrainer } from "@/lib/auth";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import { getActiveListingCount } from "@/lib/queries/listings";
import { getSubscriptionState } from "@/lib/subscription";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";

export const metadata = { title: "Billing" };

const PLAN_FEATURES = {
  basic: ["Up to 2 active listings", "Full analytics dashboard", "Listing in the public directory"],
  pro: ["Unlimited active listings", "Full analytics dashboard", "Priority placement (coming soon)"],
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireTrainer();
  const subscription = getSubscriptionState(profile);
  const activeCount = await getActiveListingCount(profile.id);
  const sp = await searchParams;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {sp.checkout === "success" ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <p className="font-medium">Payment successful!</p>
          <p className="mt-0.5 text-primary/80">
            Your subscription is being activated. It may take a moment for your
            plan to update — refresh this page if it hasn&apos;t changed yet.
          </p>
        </div>
      ) : sp.checkout === "canceled" ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Checkout was canceled. You can try again whenever you&apos;re ready.
        </div>
      ) : null}

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and plan.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-lg font-semibold text-foreground">
            {subscription.tier
              ? SUBSCRIPTION_TIERS[subscription.tier].label
              : "No active plan"}
          </p>
          <p className="text-sm text-muted-foreground">
            {activeCount} active listing{activeCount === 1 ? "" : "s"} ·{" "}
            status: {subscription.status}
          </p>
        </div>
        <Badge variant={subscription.isActive ? "default" : "outline"}>
          {subscription.isActive ? "Active" : "Inactive"}
        </Badge>
      </Card>

      {profile.stripeCustomerId ? (
        <form action={createPortalSession}>
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {(["basic", "pro"] as const).map((tierId) => {
          const tier = SUBSCRIPTION_TIERS[tierId];
          const isCurrent = subscription.tier === tierId;
          return (
            <Card
              key={tierId}
              className={cn(
                "space-y-4 p-6",
                isCurrent && "border-primary ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">
                  {tier.label}
                </h2>
                {isCurrent ? <Badge>Current</Badge> : null}
              </div>
              <p className="text-3xl font-bold text-foreground">
                ${tier.price}
                <span className="text-base font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <ul className="space-y-2 text-sm">
                {PLAN_FEATURES[tierId].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              {!isCurrent ? (
                <form action={createCheckoutSession}>
                  <input type="hidden" name="tier" value={tierId} />
                  <Button type="submit" className="w-full">
                    Subscribe to {tier.label}
                  </Button>
                </form>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
