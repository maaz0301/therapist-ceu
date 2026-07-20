"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_SIZE_ERROR,
  IMAGE_TYPE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/constants";

export function ImageUpload({
  defaultUrl,
  error,
}: {
  defaultUrl?: string | null;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [cleared, setCleared] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Object URLs live until revoked; drop the previous one on every swap and
  // on unmount so a trainer cycling through files doesn't leak blobs.
  function setObjectUrlPreview(url: string | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    setPreview(url);
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function reset(message: string | null) {
    // `accept` is only a filter hint — the OS picker still lets users choose
    // "All Files", so clear the input outright or the bad file gets submitted.
    if (inputRef.current) inputRef.current.value = "";
    setObjectUrlPreview(null);
    setCleared(true);
    setLocalError(message);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      reset(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reset(IMAGE_TYPE_ERROR);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reset(IMAGE_SIZE_ERROR);
      return;
    }

    setLocalError(null);
    setObjectUrlPreview(URL.createObjectURL(file));
    setCleared(false);
  }

  const message = localError ?? error;

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
              onError={() => reset(IMAGE_TYPE_ERROR)}
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="inline-flex">
            <input
              ref={inputRef}
              type="file"
              name="image"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={handleChange}
              aria-invalid={message ? true : undefined}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or WebP · up to 4 MB · recommended 1200×630.
          </p>
          {preview && !cleared ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => reset(null)}
            >
              <X data-icon="inline-start" />
              Remove preview
            </Button>
          ) : null}
        </div>
      </div>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
