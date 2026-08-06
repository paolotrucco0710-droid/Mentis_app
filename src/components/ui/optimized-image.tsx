"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

function isSignedOrRemoteUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  sizes,
  objectFit = "cover",
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain";
}) {
  const [loaded, setLoaded] = useState(false);
  const useUnoptimized = isSignedOrRemoteUrl(src);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "h-full w-full" : undefined,
        className
      )}
      style={!fill && width && height ? { width, height } : undefined}
    >
      {!loaded ? (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-accent/60",
            fill ? undefined : "rounded-2xl"
          )}
          aria-hidden
        />
      ) : null}
      <Image
        key={src}
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        unoptimized={useUnoptimized}
        className={cn(
          fill
            ? objectFit === "contain"
              ? "object-contain"
              : "object-cover"
            : objectFit === "contain"
              ? "h-full w-full object-contain"
              : "h-full w-full object-cover",
          !loaded && "opacity-0",
          loaded && "opacity-100 transition-opacity duration-200"
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
