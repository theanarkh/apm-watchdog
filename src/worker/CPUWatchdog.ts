import { Watchdog, WatchdogOptions } from "src/common/watchdog";
import { Worker } from 'worker_threads';

export interface CPUWatchdogOptions extends WatchdogOptions {
  threshold: number;
}

export interface ProfileEvent {
  usage: number;
  threshold: number;
  profile: string;
}

class WorkerCPUWatchdog extends Watchdog {
  worker: Worker;
  previousTime: number;
  previousCPUUsage: number[];
  options: CPUWatchdogOptions; 
  constructor(worker: Worker, options: CPUWatchdogOptions) {
    super(options);
    this.worker = worker;
  }
  async poll() {
    if (!this.previousTime) {
      this.previousTime = Date.now();
      return;
    }
    const now = Date.now();
    const currentUsage = await this.worker.cpuUsage(this.previousCPUUsage);
    const load = (currentUsage.user - this.previousCPUUsage.user) / 1000 / (now - this.previousTime)
    if (load > this.options.threshold) {
        const profile = await this.worker.startCpuProfile();
        this.emit('profile', {
            usage: load,
            threshold: this.options.threshold,
            profile,
        })
    }
    this.previousTime = now;
    this.previousCPUUsage = currentUsage;
  }
}

class WorkerCPUWatchdogManager {
  options: CPUWatchdogOptions;
  watchdogs: WorkerCPUWatchdog[] = [];
  constructor(options: CPUWatchdogOptions) {
    this.options = options;
    process.on('worker', (worker: Worker) => {
        this.watchdogs.push(new WorkerCPUWatchdog(worker, this.options));
    })
  }
}

export {
  WorkerCPUWatchdog,
  WorkerCPUWatchdogManager
}