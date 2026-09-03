export interface JobDispatcher {
  dispatch(jobId: string): Promise<void>;
}
