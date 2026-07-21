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



/**
 * The schedule is submitted as two parallel repeated fields — one `dateStart`
 * and one `dateEnd` per row, in document order — which is what a plain HTML
 * form can express without inventing an index-in-the-name convention.
 *
 * A row the trainer never filled in is dropped so an empty extra row isn't an
 * error; a row with only an end date is kept, so validation can say why.
 */
export function listingDateRows(
  formData: FormData,
): { startDate: string; endDate: string | null }[] {
  const starts = formData.getAll("dateStart");
  const ends = formData.getAll("dateEnd");

  const rows: { startDate: string; endDate: string | null }[] = [];
  for (let i = 0; i < starts.length; i++) {
    const startDate = String(starts[i] ?? "").trim();
    const endDate = String(ends[i] ?? "").trim();
    if (!startDate && !endDate) continue;
    rows.push({ startDate, endDate: endDate || null });
  }
  return rows;
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
    dates: listingDateRows(formData),
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
