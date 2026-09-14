"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const list = images && images.length ? images : [];
  const [active, setActive] = useState(0);
  const current = list[active] ?? null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden border border-foreground/10 bg-foreground/5">
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {list.map((img, index) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${alt}`}
              className={`relative aspect-square overflow-hidden border bg-foreground/5 transition-colors ${
                index === active
                  ? "border-foreground"
                  : "border-foreground/10 hover:border-foreground/40"
              }`}
            >
              <Image
                src={img}
                alt={`${alt} - view ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 12vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}