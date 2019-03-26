import { BackgroundTaskJob } from '../models';

interface JobWrapper {
  job: BackgroundTaskJob;
  canceled?: boolean;
}

export class JobManager {
  private pendingJobs: Map<string, JobWrapper> = new Map<string, JobWrapper>();

  constructor(myArg: string) {
    console.log(`${myArg}, but not in this sample`);
  }

  cancelJob = (jobId: string) => {
    this.pendingJobs.get(jobId).canceled = true;
  }

  performJob = (
    job: BackgroundTaskJob,
    onJobOver: (job: BackgroundTaskJob, success: boolean) => void,
  ) => {
    this.pendingJobs.set(job.id, {
      job,
    });

    // simple timeout call back in this example.
    setTimeout(() => onJobOver(job, !this.pendingJobs.get(job.id).canceled), 1000);
  }
}
