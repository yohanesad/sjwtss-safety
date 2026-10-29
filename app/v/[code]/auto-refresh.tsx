"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Menyegarkan data server berkala; berhenti saat tab tidak terlihat. */
export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
