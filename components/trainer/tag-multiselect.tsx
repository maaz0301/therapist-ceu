"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { suggestTag } from "@/lib/actions/listings";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import type { GroupedTags } from "@/lib/queries/tags";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; category: TagCategory };

export function TagMultiselect({
  groups,
  defaultSelected,
  error,
}: {
  groups: GroupedTags;
  defaultSelected: string[];
  error?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [extra, setExtra] = useState<Option[]>([]);
  const [suggestName, setSuggestName] = useState("");
  const [suggestCategory, setSuggestCategory] =
    useState<TagCategory>("modality");
  const [suggestError, setSuggestError] = useState<string | null>(null);
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
  }

  function handleSuggest() {
    const name = suggestName.trim();
    if (name.length < 2) {
      setSuggestError("Enter a tag name.");
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
        setExtra((prev) =>
          prev.some((t) => t.id === res.tag!.id) ? prev : [...prev, res.tag!],
        );
        setSelected((prev) =>
          prev.includes(res.tag!.id) ? prev : [...prev, res.tag!.id],
        );
        setSuggestName("");
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
            onChange={(e) => setSuggestName(e.target.value)}
            placeholder="New topic name"
            className="sm:flex-1"
          />
          <select
            value={suggestCategory}
            onChange={(e) =>
              setSuggestCategory(e.target.value as TagCategory)
            }
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {TAG_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
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
          <p className="mt-2 text-sm text-destructive">{suggestError}</p>
        ) : null}
      </div>
    </div>
  );
}
