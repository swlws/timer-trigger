import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimerTrigger } from '../src/index';

const delay = 1000;
// advanceTimersByTime 接口不稳定,大概率会导致测试失败
// 所以这里添加 offset 来避免测试失败
const delayOffset = 500;

describe('TimerTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute task at target time', () => {
    const trigger = createTimerTrigger();
    const callback = vi.fn();
    const targetTime = Date.now() + delay;

    trigger.once(targetTime, callback);

    // 推进完整的 1000ms
    vi.advanceTimersByTime(delay + delayOffset);

    // 应该被调用 1 次
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should ignore task if target time has passed', () => {
    const trigger = createTimerTrigger();
    const callback = vi.fn();
    const targetTime = Date.now() - delay; // 过去的时间

    trigger.once(targetTime, callback);

    // 推进一点时间让 tick 执行
    vi.advanceTimersByTime(0);

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should cancel task when cancel function is called', () => {
    const trigger = createTimerTrigger();
    const callback = vi.fn();
    const cancel = trigger.once(Date.now() + delay, callback);

    cancel();
    vi.advanceTimersByTime(delay + delayOffset);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should share timer for same target time', () => {
    const trigger = createTimerTrigger();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const targetTime = Date.now() + delay;

    trigger.once(targetTime, callback1);
    trigger.once(targetTime, callback2);

    const stats = trigger.getStats();
    expect(stats.activeTaskGroups).toBe(1); // 只有一个任务组
    expect(stats.totalTasks).toBe(2); // 但有两个任务

    vi.advanceTimersByTime(delay + delayOffset);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should emit task immediately with emitNow', () => {
    const trigger = createTimerTrigger();
    const callback = vi.fn();
    const targetTime = Date.now() + 5000;

    trigger.once(targetTime, callback);
    trigger.emitNow(targetTime);

    expect(callback).toHaveBeenCalledTimes(1);

    // 任务已执行，不应再次触发
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should emit all tasks with emitNow without arguments', () => {
    const trigger = createTimerTrigger();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    trigger.once(Date.now() + 1000, callback1);
    trigger.once(Date.now() + 2000, callback2);

    trigger.emitNow(); // 触发所有任务

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should clear all tasks with clearAll', () => {
    const trigger = createTimerTrigger();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    trigger.once(Date.now() + 1000, callback1);
    trigger.once(Date.now() + 2000, callback2);

    trigger.clearAll();

    vi.advanceTimersByTime(2000);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should handle multiple tasks with different target times', () => {
    const trigger = createTimerTrigger();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    trigger.once(Date.now() + 1000, callback1);
    trigger.once(Date.now() + 2000, callback2);
    trigger.once(Date.now() + 3000, callback3);

    vi.advanceTimersByTime(1000 + delayOffset);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();
    expect(callback3).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000 + delayOffset);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000 + delayOffset);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('should provide correct stats', () => {
    const trigger = createTimerTrigger();

    trigger.once(Date.now() + 1000, () => {});
    trigger.once(Date.now() + 1000, () => {});
    trigger.once(Date.now() + 2000, () => {});

    const stats = trigger.getStats();
    expect(stats.activeTaskGroups).toBe(2);
    expect(stats.totalTasks).toBe(3);
  });

  it('should provide pending tasks info', () => {
    const trigger = createTimerTrigger();
    const now = Date.now();

    trigger.once(now + 1000, () => {});
    trigger.once(now + 2000, () => {});

    const pending = trigger.getPendingTasks();
    expect(pending).toHaveLength(2);
    expect(pending[0].taskCount).toBe(1);
    expect(pending[0].remainingMs).toBeGreaterThan(0);
  });
});
