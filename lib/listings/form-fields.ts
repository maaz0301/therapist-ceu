/**
 * FormData → schema-input mapping for the listing form.
 *
 * Deliberately free of `server-only` so the client form can validate with the
 * exact same shape the server parses. Keeping one mapping is what stops the two
 * sides from drifting apart and disagreeing about what "required" means.
 */

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 ? s : null;
}

export function listingFormValues(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    presenterNames: formData.get("presenterNames") ?? "",
    credentials: formData.get("credentials") ?? "",
    format: formData.get("format") ?? "",
    isOnline: formData.get("isOnline") === "true",
    states: formData.getAll("states").map(String),
    onDemand: formData.get("onDemand") === "true",
    startDate: emptyToNull(formData.get("startDate")),
    endDate: emptyToNull(formData.get("endDate")),
    durationHours: (formData.get("durationHours") as string) ?? "",
    price: formData.get("price") ?? "0",
    registrationUrl: formData.get("registrationUrl") ?? "",
    hasCeu: formData.get("hasCeu") === "true",
    ceCount: (formData.get("ceCount") as string) ?? "",
    accreditingBody: emptyToNull(formData.get("accreditingBody")),
    websiteUrl: (formData.get("websiteUrl") as string) ?? "",
    tagIds: formData.getAll("tagIds").map(String),
  };
}
