import { TickStrategyResolver } from './strategies';

export class TimeTriggerTaskGroup {
  private timerId: number | null = null;
  private executed = false;
  private tasks: Array<() => void>;

  constructor(
    public targetTime: number,
    private resolver: TickStrategyResolver
  ) {
    this.tasks = [];

    this.tick();
  }

  isEmpty() {
    return this.taskSize() === 0;
  }

  taskSize() {
    return this.tasks.length;
  }

  addTask(callback: () => void) {
    this.tasks.push(callback);
  }

  removeTask(callback: () => void) {
    const index = this.tasks.indexOf(callback);
    if (index !== -1) {
      this.tasks.splice(index, 1);
    }
  }

  private clearTimer() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private tick() {
    const now = Date.now();
    const diff = this.targetTime - now;

    if (diff <= 0) {
      this.execute();
      return;
    }

    const strategy = this.resolver.resolve({
      now,
      targetTime: this.targetTime,
    });
    const delay = strategy.getNextDelay({ now, targetTime: this.targetTime });

    this.timerId = window.setTimeout(() => this.tick(), delay);
  }

  execute() {
    if (!this.executed) {
      this.executed = true;
      try {
        this.tasks.forEach((cb) => cb());
      } finally {
        this.destroy();
      }
    }
  }

  destroy() {
    this.clearTimer();
    this.tasks = [];
  }
}
