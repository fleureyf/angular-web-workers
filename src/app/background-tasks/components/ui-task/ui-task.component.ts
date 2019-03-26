import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BackgroundTask, BackgroundTaskStatus, BackgroundTaskMessage } from '../../models';
import { WorkerService } from '../../services/worker.service';

@Component({
  selector: 'app-ui-task',
  templateUrl: './ui-task.component.html',
})
export class UiTaskComponent implements OnInit {

  @Input() private task: BackgroundTask;

  public taskMessage$: Subject<BackgroundTaskMessage> = new Subject<BackgroundTaskMessage>();

  constructor(private workerService: WorkerService) { }

  ngOnInit() {
    this.start();
  }

  start() {
    this.workerService.startTask(this.task).pipe(
      tap(message => console.log(message)),
      tap(message => this.taskMessage$.next(message)),
    ).subscribe();
  }

  pause() {
    this.workerService.pauseTask(this.task.id);
  }

  resume() {
    this.workerService.resumeTask(this.task.id);
  }

  stop() {
    this.workerService.stopTask(this.task.id);
  }

  canPause(status: BackgroundTaskStatus) {
    return status === 'RUNNING';
  }

  canResume(status: BackgroundTaskStatus) {
    return status === 'PAUSED';
  }

  canStop(status: BackgroundTaskStatus) {
    return status === 'RUNNING' || status === 'PAUSED';
  }

  canReplay(status: BackgroundTaskStatus) {
    return status === 'TERMINATED';
  }
}
