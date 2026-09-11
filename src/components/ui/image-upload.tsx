"use client";

import { useCallback, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Button from "./button";

interface ImageUploadProps {
  value: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const urls = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value.filter((url) => url) : [];
    }
    return typeof value === "string" && value ? [value] : [];
  }, [value, multiple]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setError("");

      try {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append("file", files[i]);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Upload failed");
            return;
          }

          uploadedUrls.push(data.url);
        }

        if (multiple) {
          onChange([...urls, ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0]);
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [multiple, onChange, urls]
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (multiple) {
        onChange(urls.filter((_, i) => i !== index));
      } else {
        onChange("");
      }
    },
    [multiple, onChange, urls]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {urls.map((url, index) => (
          <div key={url} className="relative group">
            <Image
              src={url}
              alt={`Upload ${index + 1}`}
              width={120}
              height={120}
              className="h-[120px] w-[120px] rounded-lg border border-foreground/20 object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? "Uploading..."
            : multiple
            ? "Add Images"
            : "Upload Image"}
        </Button>
      </div>
    </div>
  );
}
