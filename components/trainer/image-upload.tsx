"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ImageUpload({
  defaultUrl,
  error,
}: {
  defaultUrl?: string | null;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [cleared, setCleared] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setCleared(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {preview && !cleared ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Listing preview"
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="inline-flex">
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or WebP · up to 5 MB · recommended 1200×630.
          </p>
          {preview && !cleared ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setPreview(null);
                setCleared(true);
              }}
            >
              <X data-icon="inline-start" />
              Remove preview
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
