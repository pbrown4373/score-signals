import type { JobDispatcher } from "@/lib/providers/jobs/contracts";

export class InlineMockJobDispatcher implements JobDispatcher {
  constructor(private readonly handler: (jobId: string) => Promise<void>) {}

  async dispatch(jobId: string): Promise<void> {
    await this.handler(jobId);
  }
}
