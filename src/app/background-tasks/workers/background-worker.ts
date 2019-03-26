import { JobManager } from '.';
import {
  BackgroundTaskStatus,
  WorkerActionListener,
  WorkerProperties,
  BackgroundTask,
  BackgroundTaskProgress,
  WorkerConfig,
  BackgroundTaskMessage,
  BackgroundTaskJob,
} from '../models';

declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any): void;

export class JobQueue {
  constructor(private jobs: BackgroundTaskJob[]) {}

  addJobs = (...jobs: BackgroundTaskJob[]) => {
    this.jobs.push(...jobs);
  }

  getJob = (): BackgroundTaskJob | null => {
    return this.jobs.shift();
  }

  isEmpty = (): boolean => {
    return this.jobs.length === 0;
  }
}

export class BackgroundWorker implements WorkerActionListener {
  // external JS scripts to import
  private _SCRIPTS: string[] = [
    '/assets/my_external_js_dependency.js',
  ];

  // 'injected' dependencies by the template worker creation
  private jobManager: JobManager;
  private createUploadQueue: new (jobs: BackgroundTaskJob[]) => JobQueue;
  // 'injected' properties
  private properties: WorkerProperties;

  // internal state management
  private task: BackgroundTask;
  private queue: JobQueue;
  private progress: BackgroundTaskProgress;
  private pendingJobs: BackgroundTaskJob[] = [];

  constructor(config: WorkerConfig) {
    this.properties = config.properties;
    this.createUploadQueue = config.dependencies.createJobQueue;
    this.jobManager = new config.dependencies.createJobManager(config.properties.myArg);
    importScripts(...this._SCRIPTS.map(path => this.properties.baseLocation.concat(path)));
  }

  start = (task: BackgroundTask) => {
    this.logIfDebug(`START TASK: ${task.id}`, task);

    this.task = task;
    const progress: BackgroundTaskProgress = {
      totalJobs: task.jobs.length,
      doneJobs: 0,
      progressPercent: task.jobs.length > 0 ? 0 : 100,
    };
    this.progress = progress;
    const queue: JobQueue = new this.createUploadQueue(task.jobs);
    this.queue = queue;

    // to simplify demo, tasks are paused initially.
    this.changeTaskStatus('PAUSED');
  }

  pause = (taskId: string) => {
    this.logIfDebug(`PAUSE TASK: ${taskId}`);
    this.cancelPendingJobs();
    this.changeTaskStatus('PAUSED');
  }

  resume = (taskId: string) => {
    this.logIfDebug(`RESUME TASK: ${taskId}`);
    this.changeTaskStatus('RUNNING');
    this.runTask();
  }

  stop = (taskId: string) => {
    this.logIfDebug(`STOP TASK: ${taskId}`);
    this.changeTaskStatus('STOPPED');
    this.terminateTask();
  }

  private cancelPendingJobs = () => {
      this.pendingJobs.forEach(job => this.jobManager.cancelJob(job.id));
  }

  private terminateTask = () => {
    this.cancelPendingJobs();
    this.changeTaskStatus('TERMINATED');
  }

  private runTask = () => {
    if (!this.task || this.task.status !== 'RUNNING') {
      // exit loop if task is not running
      return;
    }
    if (this.pendingJobs.length < this.properties.concurrentJobs) {
      if (this.queue.isEmpty() && this.pendingJobs.length === 0) {
        // task is over
        this.terminateTask();
        return;
      }
      const job: BackgroundTaskJob = this.queue.getJob();
      if (job) {
        this.pendingJobs.push(job);
        this.jobManager.performJob(job, this.jobOver);
        this.runTask();
      }
    }
  }

  /**
   * callback when a job is over
   */
  private jobOver = (job: BackgroundTaskJob, success: boolean) => {

    // remove pending job
    const jobIndex = this.pendingJobs.indexOf(job);
    if (jobIndex !== -1) {
      this.pendingJobs.splice(jobIndex, 1);
    }

    if (!success) {
      this.queue.addJobs(job);
      setTimeout(() => this.runTask(), 100);
      return;
    }

    this.progress.doneJobs++;
    this.progress.progressPercent = Math.ceil(
      100 * this.progress.doneJobs / this.progress.totalJobs,
    );
    this.publishMessage();

    this.runTask();
  }

  private changeTaskStatus = (status: BackgroundTaskStatus) => {
    if (this.task && this.task.status !== status) {
        this.task.status = status;
        this.publishMessage();
    }
  }

  private publishMessage = () => {
    const message: BackgroundTaskMessage = {
      taskId: this.task.id,
      taskStatus: this.task.status,
      progress: this.progress,
    };
    postMessage(message);
  }

  private logIfDebug = (...message: any[]) => {
    if (this.properties.debug) {
      console.log(...message);
    }
  }
}
