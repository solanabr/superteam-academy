"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import {
  clampOffset,
  coverScale as coverScaleOf,
  cropRect,
} from "@/lib/avatar/crop-geometry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Avatar crop dialog — the learner picks WHICH part of their photo lands in
 * the circle (owner ask 05-08). Before this, the raw file was uploaded and the
 * avatar element decided the framing, so a portrait or a wide shot was cropped
 * to its centre with no say in it.
 *
 * Self-contained on purpose: pan + zoom over a circular mask, then re-encode
 * through a canvas. No crop dependency, and because the output is always a
 * square JPEG at OUTPUT_SIZE, a 5 MB phone photo lands as a ~50 KB upload —
 * which is why the caller can accept files far larger than the old 1 MB cap.
 */

/** Circle diameter of the on-screen stage, in CSS px. */
const STAGE = 264;
/** Exported avatar edge, in px. 2× the largest place we render one (96px). */
const OUTPUT_SIZE = 512;
const MAX_ZOOM = 4;
/** Arrow-key nudge, in CSS px. */
const NUDGE = 12;

interface AvatarCropDialogProps {
  /** The picked file; null closes the dialog. */
  file: File | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

export function AvatarCropDialog({
  file,
  onCancel,
  onCropped,
}: AvatarCropDialogProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Scale at which the image exactly covers the circle; zoom multiplies it.
  const coverScale = img ? coverScaleOf(img, STAGE) : 1;
  const drawScale = coverScale * zoom;

  /** Keep the image covering the circle — no gaps at any pan position. */
  const clamp = useCallback(
    (next: { x: number; y: number }, scale: number, image: HTMLImageElement) =>
      clampOffset(next, image, scale, STAGE),
    []
  );

  // Load the picked file; reset the framing for each new photo.
  useEffect(() => {
    if (!file) {
      setImg(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Re-clamp when zooming out, so the image never pulls away from the edge.
  useEffect(() => {
    if (!img) return;
    setOffset((prev) => clamp(prev, coverScale * zoom, img));
  }, [zoom, img, coverScale, clamp]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!img) return;
    drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !img) return;
    setOffset(
      clamp(
        { x: e.clientX - drag.current.x, y: e.clientY - drag.current.y },
        drawScale,
        img
      )
    );
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!img) return;
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const move = step[e.key];
    if (!move) return;
    e.preventDefault();
    setOffset((prev) =>
      clamp({ x: prev.x + move[0], y: prev.y + move[1] }, drawScale, img)
    );
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!img) return;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.002)));
  };

  const handleConfirm = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The circle maps back to this square of natural-image pixels.
    const { sx, sy, side } = cropRect(offset, img, drawScale, STAGE);

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{t("cropTitle")}</DialogTitle>
          <DialogDescription>{t("cropHint")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-1">
          {/* Stage — the image pans under a fixed circular window. */}
          <div
            role="group"
            aria-label={t("cropTitle")}
            tabIndex={0}
            className="avatar-crop-stage"
            style={{ width: STAGE, height: STAGE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            onWheel={onWheel}
          >
            {img && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="avatar-crop-img"
                style={{
                  width: img.width * drawScale,
                  height: img.height * drawScale,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            <div className="avatar-crop-mask" aria-hidden="true" />
          </div>

          <div className="flex w-full items-center gap-3">
            <MagnifyingGlassMinus
              size={16}
              weight="bold"
              className="shrink-0 text-text-3"
              aria-hidden="true"
            />
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label={t("cropZoom")}
              className="avatar-crop-zoom"
            />
            <MagnifyingGlassPlus
              size={16}
              weight="bold"
              className="shrink-0 text-text-3"
              aria-hidden="true"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button variant="push" onClick={handleConfirm} disabled={!img}>
            {t("cropApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
