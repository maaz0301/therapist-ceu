import type { Metadata } from "next";
import { X } from "lucide-react";

import { ListingCard } from "@/components/listing-card";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteAlertAction } from "@/lib/actions/engagement";
import { requireProfile } from "@/lib/auth";
import { getAlerts, getSavedListings } from "@/lib/queries/engagement";

import { AlertForm } from "./alert-form";

export const metadata: Metadata = { title: "Saved courses & alerts" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const profile = await requireProfile();
  const [saved, alerts] = await Promise.all([
    getSavedListings(profile.id),
    getAlerts(profile.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Saved courses</h1>

      {saved.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            Nothing saved yet. Tap “Save” on any course to keep it here.
          </p>
          <ButtonLink className="mt-4" variant="clay" href="/directory">
            Browse courses
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}

      <section className="mt-14 max-w-2xl" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="font-heading text-xl font-semibold">
          Email alerts
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Get an email when a new course matching your keywords is published.
        </p>
        <AlertForm />
        {alerts.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-3 text-sm"
              >
                {a.query}
                <form action={deleteAlertAction.bind(null, a.id)}>
                  <button
                    type="submit"
                    aria-label={`Delete alert ${a.query}`}
                    className="rounded-full p-1 hover:bg-background"
                  >
                    <X className="size-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
