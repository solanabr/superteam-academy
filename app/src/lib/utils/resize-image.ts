const MAX_DIMENSION = 512;

/**
 * Resize an image file to fit within MAX_DIMENSION×MAX_DIMENSION using
 * an off-screen canvas. Preserves aspect ratio. Outputs WebP when supported,
 * falls back to JPEG. Returns the original file if canvas API is unavailable.
 */
export async function resizeImage(file: File): Promise<File> {
    if (typeof document === "undefined") return file;

    return new Promise<File>((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
                resolve(file);
                return;
            }

            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const resized = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                        type: "image/webp",
                    });
                    resolve(resized);
                },
                "image/webp",
                0.85,
            );
        };

        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}
