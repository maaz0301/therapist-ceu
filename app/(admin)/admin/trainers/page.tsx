import { Users } from "lucide-react";

import { TrainerActions } from "@/components/admin/trainer-actions";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminTrainers } from "@/lib/queries/admin";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export const metadata = { title: "Trainers" };
export const dynamic = "force-dynamic";

function tierLabel(tier: "basic" | "pro" | null) {
  if (!tier) return "No plan";
  return SUBSCRIPTION_TIERS[tier].label;
}

export default async function AdminTrainersPage() {
  const trainers = await getAdminTrainers();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Trainers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage trainer accounts and subscription plans.
        </p>
      </div>

      {trainers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No trainers yet"
          description="Trainer accounts will appear here as people sign up."
        />
      ) : (
        <div className="space-y-4">
          {trainers.map((t) => (
            <Card key={t.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {t.fullName ?? "Unnamed trainer"}
                    </h2>
                    {t.accountStatus === "suspended" ? (
                      <Badge className="bg-destructive/15 text-destructive">
                        Suspended
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/12 text-primary">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {t.contactEmail ? <span>{t.contactEmail}</span> : null}
                    <span>
                      {tierLabel(t.subscriptionTier)} · {t.subscriptionStatus}
                    </span>
                    <span>
                      {t.totalListings} listing
                      {t.totalListings === 1 ? "" : "s"} · {t.activeListings}{" "}
                      live
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <TrainerActions
                  profileId={t.id}
                  accountStatus={t.accountStatus}
                  subscriptionTier={t.subscriptionTier}
                  subscriptionStatus={t.subscriptionStatus}
                  stripeCustomerId={t.stripeCustomerId}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
