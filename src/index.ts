/* ===============================
 * Tick Strategy Definitions
 * =============================== */

interface TickStrategyContext {
  now: number;
  targetTime: number;
}

interface TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number;
}

/**
 * ≤ 1 分钟：秒级精度策略
 */
class SecondPrecisionStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    return 1000 - (ctx.now % 1000);
  }
}

/**
 * > 1 分钟：剩余时间 / 2 策略
 */
class HalfRemainingStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    const remaining = ctx.targetTime - ctx.now;
    return Math.max(Math.floor(remaining / 2), 1000);
  }
}

/**
 * 策略选择器
 */
class TickStrategyResolver {
  private second = new SecondPrecisionStrategy();
  private half = new HalfRemainingStrategy();

  resolve(ctx: TickStrategyContext): TickStrategy {
    const remainingSeconds = Math.floor((ctx.targetTime - ctx.now) / 1000);
    return remainingSeconds <= 60 ? this.second : this.half;
  }
}

/* ===============================
 * TimeTriggerTask (One-shot)
 * =============================== */

class TimeTriggerTask {
  private timerId: number | null = null;
  private executed = false;

  constructor(
    private targetTime: number,
    private callback: () => void,
    private resolver: TickStrategyResolver,
    private onCleanup: () => void
  ) {
    this.tick();
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
      if (!this.executed) {
        this.executed = true;
        try {
          this.callback();
        } finally {
          this.destroy();
        }
      }
      return;
    }

    const ctx: TickStrategyContext = { now, targetTime: this.targetTime };
    const strategy = this.resolver.resolve(ctx);
    const delay = strategy.getNextDelay(ctx);

    this.timerId = window.setTimeout(() => this.tick(), delay);
  }

  destroy() {
    this.clearTimer();
    this.onCleanup();
  }
}

/* ===============================
 * TimeTrigger (Public API)
 * =============================== */

export function createTimeTrigger() {
  const resolver = new TickStrategyResolver();
  const tasks = new Set<TimeTriggerTask | null>();

  function normalizeTime(time: number | string | Date): number {
    const ts = typeof time === 'number' ? time : new Date(time).getTime();
    if (isNaN(ts)) throw new Error('Invalid target time');
    return ts;
  }

  return {
    /**
     * 注册一次性时间触发任务
     * @param targetTime 目标时间
     * @param callback 回调函数
     */
    on(targetTime: number | string | Date, callback: () => void) {
      const ts = normalizeTime(targetTime);

      let task: TimeTriggerTask | null = new TimeTriggerTask(
        ts,
        callback,
        resolver,
        () => {
          // 自动清理 task
          // 因为任务只触发一次，所以不需要返回取消
          tasks.delete(task);
        }
      );

      return () => {
        task?.destroy();
        task = null;
      };
    },
  };
}
