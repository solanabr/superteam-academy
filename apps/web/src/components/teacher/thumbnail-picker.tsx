"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MAX_THUMBNAIL_BYTES } from "@/lib/teacher/thumbnail";

interface ThumbnailPickerProps {
  courseId: string;
  /** Currently-saved thumbnail URL (resolved from Sanity), if any. */
  initialUrl?: string | null;
}

/**
 * Mediated thumbnail picker (issue #278). Uploads the chosen image to
 * `/api/teacher/courses/[id]/thumbnail`, which streams it into Sanity
 * server-side — the browser never touches the Sanity write token. On success the
 * preview reflects the newly-stored asset URL.
 *
 * Accessible: the file input is a real labeled control (keyboard-operable, with
 * a focus-visible ring); status/errors are announced via an aria-live region.
 */
export function ThumbnailPicker({
  courseId,
  initialUrl,
}: ThumbnailPickerProps) {
  const t = useTranslations("teacher.thumbnail");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // The URL shown in the preview: starts at the saved thumbnail, updates to the
  // uploaded asset URL on success.
  const [savedUrl, setSavedUrl] = useState<string | null>(initialUrl ?? null);
  // Local object URL for the just-picked (not-yet-uploaded / uploading) file.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownUrl = previewUrl ?? savedUrl;

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError(t("errorNotImage"));
      resetInput();
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      setError(t("errorTooLarge"));
      resetInput();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setBusy(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/teacher/courses/${courseId}/thumbnail`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reason?: string;
        url?: string;
      };
      if (!res.ok || !data.url) {
        const base = data.error ?? t("errorUpload");
        setError(data.reason ? `${base}: ${data.reason}` : base);
        setPreviewUrl(null);
        return;
      }
      setSavedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUpload"));
      setPreviewUrl(null);
    } finally {
      setBusy(false);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      resetInput();
    }
  }

  function onRemove() {
    setPreviewUrl(null);
    setError(null);
    resetInput();
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{t("label")}</span>

      <div className="flex items-start gap-4">
        <div className="relative h-[90px] w-40 shrink-0 overflow-hidden rounded-md border border-border bg-[var(--input)]">
          {shownUrl ? (
            <Image
              src={shownUrl}
              alt={t("previewAlt")}
              fill
              sizes="160px"
              className="object-cover"
              unoptimized={shownUrl.startsWith("blob:")}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-text-3">
              {t("none")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex w-fit cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-text focus-within:ring-2 focus-within:ring-primary hover:bg-[var(--input)]"
          >
            {savedUrl ? t("replace") : t("choose")}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => void onFileChange(e)}
            className="sr-only"
          />
          {previewUrl && !busy && (
            <button
              type="button"
              onClick={onRemove}
              className="w-fit rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-[var(--input)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("remove")}
            </button>
          )}
          <p className="text-xs text-text-3">{t("hint")}</p>
        </div>
      </div>

      <div aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm">
        {busy && <span className="text-text-3">{t("uploading")}</span>}
        {error && (
          <span className="text-danger" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
