"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Eye, Pencil, Trash2, X } from "lucide-react";

import {
  approveListing,
  deleteListingAdmin,
  overrideListingStatus,
  rejectListing,
  setListingActiveAdmin,
  type ActionResult,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
] as const;

export function AdminListingActions({
  id,
  slug,
  status,
  active,
}: {
  id: string;
  slug: string;
  status: string;
  active: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

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
      {status === "pending" || status === "rejected" ? (
        <Button
          size="sm"
          variant="default"
          disabled={isPending}
          onClick={() => run(() => approveListing(id), "Listing approved")}
        >
          <Check data-icon="inline-start" />
          Approve
        </Button>
      ) : null}

      {status !== "rejected" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setRejectOpen(true)}
        >
          <X data-icon="inline-start" />
          Reject
        </Button>
      ) : null}

      {status === "approved" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(
              () => setListingActiveAdmin(id, !active),
              active ? "Listing deactivated" : "Listing activated",
            )
          }
        >
          {active ? "Deactivate" : "Activate"}
        </Button>
      ) : null}

      <ButtonLink
        size="sm"
        variant="ghost"
        href={`/listings/${slug}`}
        target="_blank"
      >
        <Eye data-icon="inline-start" />
        Preview
      </ButtonLink>

      <ButtonLink size="sm" variant="ghost" href={`/admin/listings/${id}/edit`}>
        <Pencil data-icon="inline-start" />
        Edit
      </ButtonLink>

      <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        Status
        <NativeSelect
          selectSize="xs"
          value={status}
          disabled={isPending}
          onChange={(e) =>
            run(
              () => overrideListingStatus(id, e.target.value),
              "Status updated",
            )
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </label>

      <Button
        size="icon-sm"
        variant="ghost"
        className="text-destructive"
        disabled={isPending}
        aria-label="Delete listing"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
            <DialogDescription>
              The trainer receives this reason by email and can edit and
              resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Please add the accrediting body for the CE credits."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              className="bg-background text-foreground border-border hover:bg-muted"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending || reason.trim().length < 3}
              onClick={() =>
                run(async () => {
                  const result = await rejectListing(id, reason);
                  if (!("error" in result)) {
                    setRejectOpen(false);
                    setReason("");
                  }
                  return result;
                }, "Listing rejected — trainer notified")
              }
            >
              Reject & notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              This permanently removes the listing and its analytics. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-background text-foreground border-border hover:bg-muted"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  const result = await deleteListingAdmin(id);
                  if (!("error" in result)) setDeleteOpen(false);
                  return result;
                }, "Listing deleted")
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
