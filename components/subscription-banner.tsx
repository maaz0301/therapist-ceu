import { AlertTriangle, BadgeCheck, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import type { SubscriptionState } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export function SubscriptionBanner({
  subscription,
  activeCount,
}: {
  subscription: SubscriptionState;
  activeCount: number;
}) {
  const tier = subscription.tier
    ? SUBSCRIPTION_TIERS[subscription.tier]
    : null;
  const limit = subscription.maxActiveListings;
  const atLimit = limit !== null && activeCount >= limit;

  if (!subscription.isActive) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-clay/30 bg-clay/5 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-clay" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              No active subscription
            </p>
            <p className="text-sm text-muted-foreground">
              Start a plan to publish your listings to the directory.
            </p>
          </div>
        </div>
        <ButtonLink variant="clay" size="sm" href="/billing">
          Choose a plan
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-4",
        atLimit ? "border-clay/30 bg-clay/10" : "border-primary/20 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-3">
        {atLimit ? (
          <AlertTriangle className="size-5 text-clay" />
        ) : (
          <BadgeCheck className="size-5 text-primary" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {tier?.label} plan
          </p>
          <p className="text-sm text-muted-foreground">
            {activeCount} of {limit === null ? "unlimited" : limit} active
            listing{limit === 1 ? "" : "s"} used.
            {atLimit
              ? " Upgrade to Pro to publish more."
              : ""}
          </p>
        </div>
      </div>
      {atLimit ? (
        <ButtonLink variant="clay" size="sm" href="/billing">
          Upgrade to Pro
        </ButtonLink>
      ) : null}
    </Card>
  );
}
