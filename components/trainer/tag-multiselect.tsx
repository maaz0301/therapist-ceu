"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { suggestTag } from "@/lib/actions/listings";
import { slugify } from "@/lib/slug";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import type { GroupedTags } from "@/lib/queries/tags";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; category: TagCategory };

export function TagMultiselect({
  groups,
  defaultSelected,
  error,
  onSelectionChange,
}: {
  groups: GroupedTags;
  defaultSelected: string[];
  error?: string;
  /** Fired whenever the selection changes so the parent can clear a stale error. */
  onSelectionChange?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [extra, setExtra] = useState<Option[]>([]);
  const [suggestName, setSuggestName] = useState("");
  const [suggestCategory, setSuggestCategory] =
    useState<TagCategory>("modality");
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestNote, setSuggestNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allOptions = useMemo<Option[]>(() => {
    const base = groups.flatMap((g) =>
      g.options.map((o) => ({ id: o.id, name: o.name, category: o.category })),
    );
    return [...base, ...extra];
  }, [groups, extra]);

  const optionsByCategory = useMemo(() => {
    const map = new Map<TagCategory, Option[]>();
    for (const cat of TAG_CATEGORIES) map.set(cat.id, []);
    for (const opt of allOptions) map.get(opt.category)?.push(opt);
    return map;
  }, [allOptions]);

  const selectedOptions = selected
    .map((id) => allOptions.find((o) => o.id === id))
    .filter((o): o is Option => Boolean(o));

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    onSelectionChange?.();
  }

  function handleSuggest() {
    const name = suggestName.trim();
    setSuggestNote(null);
    if (name.length < 2) {
      setSuggestError("Enter a tag name.");
      return;
    }

    // Catch duplicates against the tags already on screen before hitting the
    // server, so the common case answers instantly. `slugify` matches how the
    // server dedupes, making "Test", "test" and "TEST" the same tag here too.
    const slug = slugify(name);
    const known = allOptions.find((o) => slugify(o.name) === slug);
    if (known) {
      if (selected.includes(known.id)) {
        setSuggestError(`"${known.name}" is already added to this listing.`);
        return;
      }
      setSelected((prev) => [...prev, known.id]);
      onSelectionChange?.();
      setSuggestName("");
      setSuggestError(null);
      setSuggestNote(`"${known.name}" already existed — selected it for you.`);
      return;
    }

    setSuggestError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("category", suggestCategory);

    startTransition(async () => {
      const res = await suggestTag(null, formData);
      if (res?.error) {
        setSuggestError(res.error);
        return;
      }
      if (res?.tag) {
        const tag = res.tag;
        // A tag can exist server-side without being in `allOptions` — another
        // trainer suggested it, or it is pending review and not yet published.
        const alreadySelected = selected.includes(tag.id);
        setExtra((prev) =>
          prev.some((t) => t.id === tag.id) ? prev : [...prev, tag],
        );
        setSelected((prev) =>
          prev.includes(tag.id) ? prev : [...prev, tag.id],
        );
        onSelectionChange?.();
        setSuggestName("");
        if (alreadySelected) {
          setSuggestError(`"${tag.name}" is already added to this listing.`);
        } else if (res.existed) {
          setSuggestNote(`"${tag.name}" already existed — selected it for you.`);
        } else {
          setSuggestNote(`"${tag.name}" added and sent for admin review.`);
        }
      }
    });
  }

  return (
    <div className="space-y-3">
      {selected.map((id) => (
        <input key={id} type="hidden" name="tagIds" value={id} />
      ))}

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <Badge
              key={opt.id}
              variant="secondary"
              className="gap-1 pr-1 pl-2"
            >
              {opt.name}
              <button
                type="button"
                onClick={() => toggle(opt.id)}
                className="rounded-sm p-0.5 hover:bg-foreground/10"
                aria-label={`Remove ${opt.name}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No topics selected yet.</p>
      )}

      <div
        className={cn(
          "max-h-72 overflow-y-auto rounded-lg border border-border p-3",
          error && "border-destructive",
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TAG_CATEGORIES.map((cat) => {
            const options = optionsByCategory.get(cat.id) ?? [];
            if (options.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {cat.label}
                </p>
                <ul className="space-y-1.5">
                  {options.map((opt) => (
                    <li key={opt.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.includes(opt.id)}
                          onCheckedChange={() => toggle(opt.id)}
                        />
                        <span>{opt.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">
          Can&apos;t find a topic? Suggest one
        </p>
        <p className="mb-2 text-xs text-muted-foreground">
          Suggested tags are added to your listing and reviewed by an admin.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={suggestName}
            onChange={(e) => {
              setSuggestName(e.target.value);
              setSuggestError(null);
              setSuggestNote(null);
            }}
            onKeyDown={(e) => {
              // Enter inside a form would submit the listing; suggest instead.
              if (e.key === "Enter") {
                e.preventDefault();
                handleSuggest();
              }
            }}
            placeholder="New topic name"
            aria-invalid={suggestError ? true : undefined}
            className="sm:flex-1"
          />
          <NativeSelect
            selectSize="sm"
            value={suggestCategory}
            onChange={(e) =>
              setSuggestCategory(e.target.value as TagCategory)
            }
          >
            {TAG_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggest}
            disabled={isPending}
          >
            <Plus data-icon="inline-start" />
            {isPending ? "Adding…" : "Add"}
          </Button>
        </div>
        {suggestError ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {suggestError}
          </p>
        ) : suggestNote ? (
          <p role="status" className="mt-2 text-sm text-muted-foreground">
            {suggestNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
