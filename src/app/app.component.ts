import { Component, OnInit } from '@angular/core';

import { BackgroundTask, BackgroundTaskJob } from './background-tasks/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Angular web workers demo';
  tasks: BackgroundTask[] = [];

  constructor() {
  }

  ngOnInit() {
    this.generateTasks(5);
  }

  private generateTasks(taskCount: number) {
    for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
      const id = `TASK-${taskIndex}`;
      this.tasks.push({
        id,
        jobs: this.generateJobs(id, 1 + Math.floor(Math.random() * 16)),
      });
    }
  }

  private generateJobs(taskId: string, count: number): BackgroundTaskJob[] {
    const jobs: BackgroundTaskJob[] = [];
    for (let job = 0; job < count; job ++) {
      jobs.push({
        id: `${taskId}-${job}`,
        name: `job-${job}-forTask-${taskId}`,
      });
    }
    return jobs;
  }
}
