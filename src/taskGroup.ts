import { TickStrategyResolver } from './strategies';

export class TimeTriggerTaskGroup {
  private timerId: number | null = null;
  private executed = false;

  constructor(
    public targetTime: number,
    private tasks: Set<() => void>,
    private resolver: TickStrategyResolver
  ) {
    this.tick();
  }

  addTask(callback: () => void) {
    this.tasks.add(callback);
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
    this.tasks.clear();
  }
}
