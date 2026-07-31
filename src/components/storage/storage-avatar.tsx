"use client";

import { useEffect, useState } from "react";
import { isStorageKey } from "@/components/profile/profile-utils";
import { Avatar } from "@/components/ui";
import { ApiError, fetchAvatarUrl } from "@/lib/api";

export function StorageAvatar({
  name,
  imageRef,
  className,
}: {
  name: string;
  imageRef?: string | null;
  className?: string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageRef || !isStorageKey(imageRef)) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchAvatarUrl();
        if (!cancelled) {
          setSignedUrl(result.url);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 404)) {
          setSignedUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageRef]);

  const src = !imageRef
    ? null
    : isStorageKey(imageRef)
      ? signedUrl
      : imageRef;

  return <Avatar name={name} src={src} className={className} />;
}
