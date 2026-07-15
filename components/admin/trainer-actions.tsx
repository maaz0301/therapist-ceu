"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, RotateCcw, Settings2 } from "lucide-react";

import {
  reactivateAccount,
  setSubscription,
  suspendAccount,
  type ActionResult,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TrainerActions({
  profileId,
  accountStatus,
  subscriptionTier,
  subscriptionStatus,
  stripeCustomerId,
}: {
  profileId: string;
  accountStatus: "active" | "suspended";
  subscriptionTier: "basic" | "pro" | null;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [tier, setTier] = useState<string>(subscriptionTier ?? "none");
  const [status, setStatus] = useState<string>(subscriptionStatus);

  function run(fn: () => Promise<ActionResult>, successMsg: string) {
    startTransition(async () => {
      const result = await fn();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => setSubOpen(true)}
      >
        <Settings2 data-icon="inline-start" />
        Subscription
      </Button>

      {accountStatus === "active" ? (
        <Button
          size="sm"
          variant="outline"
          className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isPending}
          onClick={() => setSuspendOpen(true)}
        >
          <Ban data-icon="inline-start" />
          Suspend
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() => reactivateAccount(profileId), "Account reactivated")
          }
        >
          <RotateCcw data-icon="inline-start" />
          Reactivate
        </Button>
      )}

      {/* Suspend confirm */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend this account?</DialogTitle>
            <DialogDescription>
              All of this trainer&apos;s listings will be removed from the public
              directory until you reactivate them. They keep their account and
              data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  const result = await suspendAccount(profileId);
                  if (!("error" in result)) setSuspendOpen(false);
                  return result;
                }, "Account suspended")
              }
            >
              Suspend account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage subscription</DialogTitle>
            <DialogDescription>
              Billing is normally driven by Stripe. Changing these here
              overrides that until the next Stripe webhook fires (e.g. their
              next renewal or cancellation), so use this for edge cases like
              comping an account — not as the everyday way to manage plans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {stripeCustomerId ? (
              <div className="flex flex-col gap-1.5">
                <Label>Stripe customer</Label>
                <a
                  href={`https://dashboard.stripe.com/test/customers/${stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary underline-offset-2 hover:underline"
                >
                  {stripeCustomerId}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No Stripe customer linked yet — this trainer hasn&apos;t
                completed checkout.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier">Plan tier</Label>
              <select
                id="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className={selectClass}
              >
                <option value="none">No plan</option>
                <option value="basic">Basic (up to 2 listings)</option>
                <option value="pro">Pro (unlimited)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-status">Status</Label>
              <select
                id="sub-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClass}
              >
                <option value="none">None</option>
                <option value="trialing">Trialing</option>
                <option value="active">Active</option>
                <option value="past_due">Past due</option>
                <option value="canceled">Canceled</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  const result = await setSubscription(
                    profileId,
                    tier === "none" ? null : (tier as "basic" | "pro"),
                    status,
                  );
                  if (!("error" in result)) setSubOpen(false);
                  return result;
                }, "Subscription updated")
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
