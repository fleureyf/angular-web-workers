import { BackgroundTask, BackgroundTaskJob } from './background-task.model';
import { JobManager, JobQueue } from '../workers';

export interface WorkerConfig {
  properties: WorkerProperties;
  dependencies: {
    createJobManager: new (myArg: string) => JobManager;
    createJobQueue: new (jobs: BackgroundTaskJob[]) => JobQueue;
  };
}

export interface WorkerProperties {
  baseLocation: string;
  debug: boolean;
  concurrentJobs: number;
  myArg: string;
}

export interface WorkerActionListener {
  start: (task: BackgroundTask) => void;
  stop: (taskId: string) => void;
  pause: (taskId: string) => void;
  resume: (taskId: string) => void;
}

export type WorkerAction = 'start' | 'stop' | 'pause' | 'resume';
