"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";

interface ImageUploadProps {
  currentUrl: string | null;
  onUpload: (result: { assetId: string; url: string }) => void;
}

export function ImageUpload({ currentUrl, onUpload }: ImageUploadProps) {
  const t = useTranslations("admin");
  const { walletAddress } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !walletAddress) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "X-Wallet-Address": walletAddress },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUpload(data);
    } catch (err) {
      console.error("[ImageUpload]", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("thumbnail")}</label>
      {currentUrl && (
        <img
          src={currentUrl}
          alt=""
          className="h-24 w-40 rounded-md border object-cover"
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? t("uploading") : t("uploadImage")}
      </Button>
    </div>
  );
}
