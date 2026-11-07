"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteReviewAction,
  replyToReviewAction,
  submitReviewAction,
  type EngagementState,
} from "@/lib/actions/engagement";
import type { ReviewView } from "@/lib/queries/engagement";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            "size-4 " + (n <= Math.round(value) ? "fill-clay text-clay" : "text-border")
          }
        />
      ))}
    </span>
  );
}

function ReviewForm({
  listingId,
  existing,
}: {
  listingId: string;
  existing?: ReviewView;
}) {
  const [state, action, pending] = useActionState<EngagementState, FormData>(
    submitReviewAction,
    null,
  );
  const [rating, setRating] = useState(existing?.rating ?? 0);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
            >
              <Star
                className={
                  "size-7 " + (n <= rating ? "fill-clay text-clay" : "text-border")
                }
              />
            </button>
          ))}
        </div>
      </fieldset>
      <textarea
        name="body"
        rows={4}
        required
        minLength={10}
        maxLength={2000}
        defaultValue={existing?.body}
        placeholder="What did you learn? Who is it for?"
        className="w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Button type="submit" variant="clay" disabled={pending}>
        {existing ? "Update review" : "Post review"}
      </Button>
    </form>
  );
}

function ReplyForm({ reviewId }: { reviewId: string }) {
  const [state, action, pending] = useActionState<EngagementState, FormData>(
    replyToReviewAction,
    null,
  );
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <textarea
        name="reply"
        rows={2}
        required
        maxLength={1000}
        placeholder="Reply publicly as the trainer"
        className="w-full rounded-xl border border-input bg-card p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Reply
      </Button>
    </form>
  );
}

export function ReviewsSection({
  listingId,
  reviews,
  summary,
  viewer,
  ownerId,
}: {
  listingId: string;
  reviews: ReviewView[];
  summary: { average: number | null; total: number };
  viewer: { id: string; isAdmin: boolean } | null;
  ownerId: string;
}) {
  const mine = viewer ? reviews.find((r) => r.userId === viewer.id) : undefined;
  const isOwner = viewer?.id === ownerId;

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="reviews-heading" className="font-heading text-xl font-semibold">
          Reviews
        </h2>
        {summary.average ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={summary.average} />
            {summary.average.toFixed(1)} · {summary.total} review
            {summary.total === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        {!viewer ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="text-primary underline">
              sign up
            </Link>{" "}
            to review this course.
          </p>
        ) : isOwner ? (
          <p className="text-sm text-muted-foreground">
            You can’t review your own course, but you can reply to reviews below.
          </p>
        ) : (
          <ReviewForm listingId={listingId} existing={mine} />
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium">{r.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {viewer && (viewer.id === r.userId || viewer.isAdmin) ? (
                  <form action={deleteReviewAction.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
              <p className="mt-2 text-sm whitespace-pre-line">{r.body}</p>
              {r.trainerReply ? (
                <div className="mt-3 rounded-xl bg-accent p-3 text-sm">
                  <p className="font-medium">Reply from the trainer</p>
                  <p className="mt-1 whitespace-pre-line text-muted-foreground">
                    {r.trainerReply}
                  </p>
                </div>
              ) : isOwner ? (
                <ReplyForm reviewId={r.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
