"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, UserPlus } from "lucide-react";

import { inviteTrainer } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InviteTrainerButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"basic" | "pro" | "none">("none");
  const [status, setStatus] = useState<
    "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid"
  >("none");

  // Set when the account was created but the invite mail could not be sent —
  // the admin has to deliver this link themselves.
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setTier("none");
    setStatus("none");
    setManualLink(null);
    setCopied(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const copyLink = async () => {
    if (!manualLink) return;
    try {
      await navigator.clipboard.writeText(manualLink);
      setCopied(true);
      toast.success("Invitation link copied.");
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await inviteTrainer(fullName, email, tier, status);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      router.refresh();

      if (!result.emailSent) {
        // Keep the dialog open so the link doesn't vanish before it's copied.
        setManualLink(result.inviteUrl);
        toast.warning(
          "Trainer created, but the invitation email could not be sent. Share the link below.",
        );
        return;
      }

      toast.success(
        "Trainer invited successfully! Check email for invitation.",
      );
      setIsOpen(false);
      resetForm();
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <UserPlus data-icon="inline-start" />
        Invite Trainer
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {manualLink ? "Share this invitation link" : "Invite Trainer"}
            </DialogTitle>
            <DialogDescription>
              {manualLink
                ? "The trainer account was created, but the invitation email could not be sent. Send them this one-time link so they can set a password and log in."
                : "Send an email invitation to a new trainer. They will receive a link to set up their password and log in."}
            </DialogDescription>
          </DialogHeader>

          {manualLink ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-link">Invitation link</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    readOnly
                    value={manualLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    aria-label="Copy invitation link"
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link is single-use and expires. To send invitations
                  automatically, configure <code>SMTP_HOST</code> (or{" "}
                  <code>SENDGRID_API_KEY</code>) in the environment.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-fullName">Full Name</Label>
                <Input
                  id="invite-fullName"
                  type="text"
                  placeholder="Jane Doe, LCSW"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="trainer@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="invite-tier">Subscription Tier</Label>
                  <NativeSelect
                    id="invite-tier"
                    value={tier}
                    onChange={(e) =>
                      setTier(e.target.value as "basic" | "pro" | "none")
                    }
                    className="w-full"
                    disabled={isPending}
                  >
                    <option value="none">No Plan</option>
                    <option value="basic">Basic (up to 2 listings)</option>
                    <option value="pro">Pro (unlimited)</option>
                  </NativeSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="invite-status">Subscription Status</Label>
                  <NativeSelect
                    id="invite-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as
                          | "none"
                          | "trialing"
                          | "active"
                          | "past_due"
                          | "canceled"
                          | "unpaid",
                      )
                    }
                    className="w-full"
                    disabled={isPending}
                  >
                    <option value="none">None</option>
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="unpaid">Unpaid</option>
                  </NativeSelect>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Inviting..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
