import { Watchdog, WatchdogOptions } from "src/common/watchdog";
import { Worker } from 'worker_threads';

export interface MemoryWatchdogOptions extends WatchdogOptions {
  threshold: number;
}

export interface ProfileEvent {
  threshold: number;
  snapshot: string;
}

export class WorkerMemoryWatchdog extends Watchdog {
  worker: Worker;
  options: MemoryWatchdogOptions; 
  constructor(worker: Worker, options: MemoryWatchdogOptions) {
    super(options);
    this.worker = worker;
  }
  async poll() {
    const memory = await this.worker.getHeapStatistics();
    // TODO: support percentage
    if (memory.used_heap_size > this.options.threshold) {
      const snapshot = await this.worker.getHeapSnapshot();
      this.emit('snapshot', {
          memory,
          threshold: this.options.threshold,
          snapshot,
      })
    }
  }
}

export class WorkerMemoryWatchdogManager {
  options: MemoryWatchdogOptions;
  watchdogs: WorkerMemoryWatchdog[] = [];
  constructor(options: MemoryWatchdogOptions) {
    this.options = options;
    process.on('worker', (worker: Worker) => {
        this.watchdogs.push(new WorkerMemoryWatchdog(worker, this.options));
    })
  }
}
