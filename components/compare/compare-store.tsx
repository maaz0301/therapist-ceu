"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { GitCompareArrows, X } from "lucide-react";

import { COMPARE_MAX } from "@/lib/compare";

const KEY = "skillhive:compare";
const EVENT = "skillhive:compare-change";

export type CompareItem = { slug: string; title: string };

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function write(items: CompareItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode): selection just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const items = useMemo<CompareItem[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, COMPARE_MAX) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const toggle = useCallback(
    (item: CompareItem) => {
      if (items.some((i) => i.slug === item.slug)) {
        write(items.filter((i) => i.slug !== item.slug));
      } else if (items.length < COMPARE_MAX) {
        write([...items, item]);
      }
    },
    [items],
  );
  const clear = useCallback(() => write([]), []);
  return { items, toggle, clear, full: items.length >= COMPARE_MAX };
}

/** Small pill button shown on each listing card. */
export function CompareToggle({ slug, title }: CompareItem) {
  const { items, toggle, full } = useCompare();
  const selected = items.some((i) => i.slug === slug);
  const disabled = !selected && full;
  return (
    <button
      type="button"
      onClick={() => toggle({ slug, title })}
      disabled={disabled}
      aria-pressed={selected}
      title={disabled ? `Compare up to ${COMPARE_MAX} courses` : undefined}
      className={
        "relative z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
        (selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
      }
    >
      <GitCompareArrows className="size-3.5" />
      {selected ? "Added" : "Compare"}
    </button>
  );
}

/** Sticky tray that appears once something is selected. */
export function CompareBar() {
  const { items, toggle, clear } = useCompare();
  if (items.length === 0) return null;
  const href = `/compare?s=${items.map((i) => encodeURIComponent(i.slug)).join(",")}`;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl">
      <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
        {items.map((i) => (
          <li
            key={i.slug}
            className="flex max-w-[11rem] items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs"
          >
            <span className="truncate">{i.title}</span>
            <button
              type="button"
              aria-label={`Remove ${i.title}`}
              onClick={() => toggle(i)}
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Clear
      </button>
      <Link
        href={href}
        aria-disabled={items.length < 2}
        className={
          "rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground " +
          (items.length < 2 ? "pointer-events-none opacity-50" : "")
        }
      >
        Compare ({items.length})
      </Link>
    </div>
  );
}
