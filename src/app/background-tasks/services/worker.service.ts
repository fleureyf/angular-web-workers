import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WorkerProperties, BackgroundTaskMessage, BackgroundTask, WorkerAction, WorkerActionListener } from '../models';
import { JobQueue, JobManager, BackgroundWorker } from '../workers';

@Injectable({
  providedIn: 'root',
})
export class WorkerService {
  private properties: WorkerProperties = {
    baseLocation: location.origin,
    debug: false,
    concurrentJobs: 2,
    myArg: 'can be useful',
  };

  private workerURL: string;
  private workers: Map<string, Worker> = new Map<string, Worker>();

  startTask(task: BackgroundTask): Observable<BackgroundTaskMessage> {
    const worker = new Worker(this.getOrCreateWorkerUrl());
    this.workers.set(task.id, worker);
    return this.createWorkerObservableForTask(worker, task);
  }

  pauseTask(taskId: string) {
    this.notify(taskId, 'pause', taskId);
  }

  resumeTask(taskId: string) {
    this.notify(taskId, 'resume', taskId);
  }

  stopTask(taskId: string) {
    this.notify(taskId, 'stop', taskId);
  }

  private createWorkerObservableForTask(worker: Worker, task: BackgroundTask): Observable<BackgroundTaskMessage> {
    return Observable.create((observer: any) => {
      worker.addEventListener('message', event => {
        const message: BackgroundTaskMessage = event.data;
        if (message.taskId === task.id) {
          observer.next(message);
          if (message.taskStatus === 'TERMINATED') {
            observer.complete();
            worker.terminate();
          }
        }
      });
      worker.addEventListener('error', error => observer.error(error));
      this.notify(task.id, 'start', task);
    });
  }

  private getOrCreateWorkerUrl(): string {
    if (!this.workerURL) {
      this.workerURL = this.createWorkerUrl();
    }
    return this.workerURL;
  }

  private notify(taskId: string, action: WorkerAction, payload: any) {
    if (this.workers.has(taskId)) {
      this.workers.get(taskId).postMessage({
        action,
        payload,
      });
    }
  }

  /**
   * Add the message event listener to the worker.
   */
  private createWorkerUrl(): string {
    const webWorkerTemplate = `
        ${this.createWorkerTemplate()}
        self.addEventListener('message', function(event) {
          (${this.workerListener.toString()})(worker, event.data.action, event.data.payload);
        });
    `;
    const blob = new Blob([webWorkerTemplate], { type: 'text/javascript' });
    return URL.createObjectURL(blob);
  }

  /**
   * The magic part.
   */
  private createWorkerTemplate(): string {
    const webWorkerTemplate = `
            var config = {
              properties: {
                baseLocation: '${this.properties.baseLocation}',
                debug: ${this.properties.debug},
                concurrentJobs: ${this.properties.concurrentJobs},
                myArg: '${this.properties.myArg}',
              },
              dependencies: {
                createJobManager: ${JobManager.toString()},
                createJobQueue: ${JobQueue.toString()},
              },
            }
            var worker = new ${BackgroundWorker.toString()}(config);
        `;
    return webWorkerTemplate;
  }

  /**
   * Will be exectuted by the worker thanks to the 'template injection'.
   */
  private workerListener(worker: WorkerActionListener, action: WorkerAction, payload: any) {
    switch (action) {
      case 'start':
        worker.start(payload);
        break;
      case 'stop':
        worker.stop(payload);
        break;
      case 'resume':
        worker.resume(payload);
        break;
      case 'pause':
        worker.pause(payload);
        break;
      default:
        break;
    }
  }
}
