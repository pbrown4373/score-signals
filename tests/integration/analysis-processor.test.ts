import { describe, expect, it, vi } from "vitest";

import { MockModelGateway } from "@/lib/providers/ai/mock";
import { MockStorageAdapter } from "@/lib/providers/storage/mock-storage";
import { MockTranscriptionProvider } from "@/lib/providers/transcription/mock";
import { processAnalysisJob } from "@/modules/analysis/processor";
import type { AnalysisWorkerStore } from "@/modules/analysis/repository";

describe("analysis processor persistence boundary", () => {
  it("fails the durable job and never completes a malformed deconstruction", async () => {
    const completeCreativeDNA = vi.fn();
    const fail = vi.fn();
    const repository = {
      claim: vi.fn().mockResolvedValue({
        attempt: 1,
        creative_asset_id: "10000000-0000-0000-0000-000000000001",
        tenant_id: "20000000-0000-0000-0000-000000000002",
      }),
      completeCreativeDNA,
      completeTranscript: vi.fn(),
      fail,
      getInputs: vi.fn().mockResolvedValue({
        artifacts: [],
        asset: {
          content_sha256: "a".repeat(64),
          duration_ms: 1000,
          height: 90,
          mime_type: "video/mp4",
          width: 160,
        },
        transcript: {
          language: "en",
          schema_version: "1.0",
          segments: [],
          text_content: "Synthetic transcript",
        },
      }),
      getJobKind: vi.fn(),
      startRun: vi
        .fn()
        .mockResolvedValue("30000000-0000-0000-0000-000000000003"),
    } as unknown as AnalysisWorkerStore;

    await processAnalysisJob("40000000-0000-0000-0000-000000000004", {
      gateway: new MockModelGateway({ schema_version: "1.0" }),
      repository,
      storage: new MockStorageAdapter(".score-data/unused-analysis-test"),
      transcription: new MockTranscriptionProvider(),
    });

    expect(completeCreativeDNA).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith(
      "40000000-0000-0000-0000-000000000004",
      "30000000-0000-0000-0000-000000000003",
      expect.objectContaining({ code: "CREATIVE_ANALYSIS_INVALID_OUTPUT" }),
    );
  });
});
