"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ApiFailure = { error?: { message?: string } };

export function MediaUploadForm({
  maximumMegabytes,
}: {
  maximumMegabytes: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("video");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose an MP4, MOV, or WebM video.");
      return;
    }
    try {
      setStage("Preparing private upload…");
      const initialization = await fetch("/api/creative/upload-init", {
        body: JSON.stringify({
          byte_size: file.size,
          filename: file.name,
          idempotency_key: crypto.randomUUID(),
          mime_type: file.type,
          title: String(form.get("title") ?? ""),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const initialized = await readJson(initialization);
      if (!initialization.ok) throw new Error(failureMessage(initialized));

      setStage("Uploading securely…");
      const upload = initialized.upload as {
        headers: Record<string, string>;
        method: string;
        url: string;
      };
      const uploadResponse = await fetch(upload.url, {
        body: file,
        headers: upload.headers,
        method: upload.method,
      });
      if (!uploadResponse.ok) {
        throw new Error(failureMessage(await readJson(uploadResponse)));
      }

      setStage("Validating and processing media…");
      const completion = await fetch("/api/creative/upload-complete", {
        body: JSON.stringify({
          creative_asset_id: initialized.creative_asset_id,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const completed = await readJson(completion);
      if (!completion.ok) throw new Error(failureMessage(completed));
      router.push(`/app/library/${initialized.creative_asset_id}`);
      router.refresh();
    } catch (cause) {
      setStage("");
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={submit}>
      <label className="block">
        <span className="font-semibold">Creative title</span>
        <input
          className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4"
          maxLength={200}
          name="title"
          placeholder="Optional internal label"
        />
      </label>
      <label className="block rounded-2xl border border-dashed border-[var(--accent)] bg-white p-6">
        <span className="font-semibold">Video file</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">
          MP4, MOV, or WebM · up to {maximumMegabytes} MB
        </span>
        <input
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="mt-4 block w-full"
          name="video"
          required
          type="file"
        />
      </label>
      {stage ? <p aria-live="polite">{stage}</p> : null}
      {error ? (
        <p aria-live="assertive" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        className="min-h-11 rounded-full bg-[var(--accent)] px-6 py-2 font-semibold text-white disabled:opacity-60"
        disabled={Boolean(stage)}
        type="submit"
      >
        Upload and process
      </button>
    </form>
  );
}

async function readJson(
  response: Response,
): Promise<Record<string, unknown> & ApiFailure> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown> &
    ApiFailure;
}

function failureMessage(value: ApiFailure): string {
  return value.error?.message ?? "The upload could not be completed.";
}
