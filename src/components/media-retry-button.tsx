"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaRetryButton({ creativeId }: { creativeId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function retry() {
    setMessage("Retrying…");
    const response = await fetch(`/api/creative/${creativeId}/retry`, {
      method: "POST",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      setMessage(body.error?.message ?? "Retry failed.");
      return;
    }
    setMessage("Retry queued.");
    router.refresh();
  }

  return (
    <div>
      <button
        className="min-h-11 rounded-full border border-[var(--line)] px-5 py-2 font-semibold"
        onClick={retry}
        type="button"
      >
        Retry processing
      </button>
      {message ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
      ) : null}
    </div>
  );
}
