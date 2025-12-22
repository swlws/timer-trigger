export interface TickStrategyContext {
  now: number;
  targetTime: number;
}

export interface TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number;
}

export class SecondPrecisionStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    return 1000 - (ctx.now % 1000);
  }
}

export class HalfRemainingStrategy implements TickStrategy {
  getNextDelay(ctx: TickStrategyContext): number {
    const remaining = ctx.targetTime - ctx.now;
    return Math.max(Math.floor(remaining / 2), 1000);
  }
}

export class TickStrategyResolver {
  private second = new SecondPrecisionStrategy();
  private half = new HalfRemainingStrategy();

  constructor(private precisionThreshold = 60) {}

  resolve(ctx: TickStrategyContext): TickStrategy {
    const remainingSeconds = Math.floor((ctx.targetTime - ctx.now) / 1000);
    return remainingSeconds <= this.precisionThreshold
      ? this.second
      : this.half;
  }
}
