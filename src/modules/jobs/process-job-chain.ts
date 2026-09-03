import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { createServiceClient } from "@/lib/supabase/service";
import { processAnalysisJob } from "@/modules/analysis/processor";
import { AnalysisWorkerRepository } from "@/modules/analysis/repository";
import { processMediaJob } from "@/modules/media/processor";
import { MediaWorkerRepository } from "@/modules/media/repository";

export async function processJobChain(jobId: string): Promise<void> {
  const serviceClient = createServiceClient();
  const analysisRepository = new AnalysisWorkerRepository(serviceClient);
  const storage = createStorageAdapter();
  const kind = await analysisRepository.getJobKind(jobId);

  if (kind === "MEDIA_PROCESSING") {
    const nextJobId = await processMediaJob(jobId, {
      repository: new MediaWorkerRepository(serviceClient),
      storage,
    });
    if (nextJobId) {
      await processAnalysisJob(nextJobId, {
        repository: analysisRepository,
        storage,
      });
    }
    return;
  }
  if (kind === "CREATIVE_ANALYSIS") {
    await processAnalysisJob(jobId, {
      repository: analysisRepository,
      storage,
    });
  }
}
