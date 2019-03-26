export type BackgroundTaskStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'TERMINATED';

export interface BackgroundTask {
  id: string;
  jobs: BackgroundTaskJob[];
  status?: BackgroundTaskStatus;
}

export interface BackgroundTaskMessage {
  taskId: string;
  taskStatus: BackgroundTaskStatus;
  progress: BackgroundTaskProgress;
}

export interface BackgroundTaskProgress {
  totalJobs: number;
  doneJobs: number;
  progressPercent: number;
}

export interface BackgroundTaskJob {
  id: string;
  name: string;
}
