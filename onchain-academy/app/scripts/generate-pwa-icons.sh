#!/bin/bash
# Generate PWA raster icons from the SVG source.
# Requires: librsvg2-bin (apt install librsvg2-bin)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../public"
SVG="$PUBLIC_DIR/icon.svg"

if [ ! -f "$SVG" ]; then
  echo "Error: $SVG not found" >&2
  exit 1
fi

if ! command -v rsvg-convert &> /dev/null; then
  echo "Error: rsvg-convert not found. Install with: apt install librsvg2-bin" >&2
  exit 1
fi

rsvg-convert -w 192 -h 192 "$SVG" -o "$PUBLIC_DIR/icon-192.png"
rsvg-convert -w 512 -h 512 "$SVG" -o "$PUBLIC_DIR/icon-512.png"

echo "Generated icon-192.png and icon-512.png in $PUBLIC_DIR"
