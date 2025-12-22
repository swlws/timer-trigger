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

class SecondPrecisionStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    return 1000 - (ctx.now % 1000);
  }
}

class HalfRemainingStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    const remaining = ctx.targetTime - ctx.now;
    return Math.max(Math.floor(remaining / 2), 1000);
  }
}

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
    public targetTime: number,
    private callback: () => void,
    private resolver: TickStrategyResolver
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
      this.execute();
      return;
    }

    const ctx: TickStrategyContext = { now, targetTime: this.targetTime };
    const strategy = this.resolver.resolve(ctx);
    const delay = strategy.getNextDelay(ctx);

    this.timerId = window.setTimeout(() => this.tick(), delay);
  }

  execute() {
    if (!this.executed) {
      this.executed = true;
      try {
        this.callback();
      } finally {
        this.destroy();
      }
    }
  }

  destroy() {
    this.clearTimer();
  }
}

/* ===============================
 * TimeTrigger (Public API)
 * =============================== */

export function createTimeTrigger() {
  const resolver = new TickStrategyResolver();
  const tasks = new Set<TimeTriggerTask>();

  function normalizeTime(time: number | string | Date): number {
    const ts = typeof time === 'number' ? time : new Date(time).getTime();
    if (isNaN(ts)) throw new Error('Invalid target time');
    return ts;
  }

  return {
    /**
     * 注册一次性时间触发任务
     */
    on(targetTime: number | string | Date, callback: () => void) {
      const ts = normalizeTime(targetTime);

      const doCallback = () => {
        try {
          callback();
        } finally {
          task.destroy();
          tasks.delete(task);
        }
      };
      const task = new TimeTriggerTask(ts, doCallback, resolver);

      tasks.add(task);

      return () => {
        task.destroy();
        tasks.delete(task);
      };
    },

    /**
     * 立即触发指定目标时间的任务
     * @param targetTimes 可选，单个时间或时间数组；不传则触发所有任务
     */
    emitNow(
      targetTimes?: number | string | Date | Array<number | string | Date>
    ) {
      let times: number[];
      if (targetTimes === undefined) {
        // 不传参数，触发全部任务
        tasks.forEach((task) => task.execute());
        tasks.clear();
        return;
      }

      if (!Array.isArray(targetTimes)) {
        times = [normalizeTime(targetTimes)];
      } else {
        times = targetTimes.map(normalizeTime);
      }

      tasks.forEach((task) => {
        if (times.includes(task.targetTime)) {
          task.execute();
          tasks.delete(task);
        }
      });
    },

    /**
     * 清理所有任务
     */
    clearAll() {
      tasks.forEach((task) => task.destroy());
      tasks.clear();
    },
  };
}
