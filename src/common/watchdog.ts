import { EventEmitter } from 'events';

export interface WatchdogOptions {
  interval: number;
}

export class Watchdog extends EventEmitter {   
  timer: NodeJS.Timeout | null;
  options: WatchdogOptions;
  constructor(options: WatchdogOptions) {
    super();
    this.options = options;
  }
  start() {
    this.timer = setTimeout(async () => {
      await this.poll();
      this.start();
    }, this.options.interval);
  }

  stop() {
    clearTimeout(this.timer as NodeJS.Timeout);
    this.timer = null;
  }

  async poll() {
    throw new Error('not implement');
  }
}