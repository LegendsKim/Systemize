"use client";
// Required: logout purges browser-held PWA and draft data before submitting.

import { useRef, type FormEvent } from "react";
import { signOut } from "@/features/portal/auth/actions";
import { clearAllLocalIntakeDrafts } from "@/features/portal/workflow/intake-draft";

export function PwaSignOutForm({
  buttonClassName,
  buttonVariant,
}: {
  readonly buttonClassName: string;
  readonly buttonVariant?: string;
}) {
  const purged = useRef(false);

  function submitAfterPurge(event: FormEvent<HTMLFormElement>) {
    if (purged.current) return;
    event.preventDefault();
    const form = event.currentTarget;
    void (async () => {
      clearAllLocalIntakeDrafts();
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("systemize-pwa-"))
            .map((key) => window.caches.delete(key))
        );
      }
      navigator.serviceWorker?.controller?.postMessage({
        type: "PURGE_PWA_CACHES",
      });
    })().finally(() => {
      purged.current = true;
      form.requestSubmit();
    });
  }

  return (
    <form action={signOut} onSubmit={submitAfterPurge}>
      <button
        type="submit"
        className={buttonClassName}
        data-variant={buttonVariant}
      >
        יציאה
      </button>
    </form>
  );
}
