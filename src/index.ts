import { TickStrategyResolver } from './strategies';
import { TimeTriggerTaskGroup } from './taskGroup';
import { normalizeTime } from './utils';

interface CreateTimerTriggerOption {
  debug?: boolean;
}

export function createTimerTrigger(option: CreateTimerTriggerOption = {}) {
  const { debug = false } = option;

  const log = (msg: string, ...args: any[]) => {
    if (debug) console.log(`[TimerTrigger] ${msg}`, ...args);
  };

  const resolver = new TickStrategyResolver();
  const taskGroups = new Map<number, TimeTriggerTaskGroup>();

  return {
    /**
     * 注册一次性时间触发任务
     */
    once(targetTime: number | string | Date, callback: () => void) {
      const ts = normalizeTime(targetTime);
      log('Registering task for', ts);

      let group = taskGroups.get(ts);
      if (!group) {
        group = new TimeTriggerTaskGroup(ts, resolver);
        taskGroups.set(ts, group);
      }

      const wrappedCallback = () => {
        try {
          callback();
        } finally {
          group!.destroy();
          taskGroups.delete(ts);
        }
      };

      group.addTask(wrappedCallback);

      // 返回取消函数
      return () => {
        group!.removeTask(wrappedCallback);
        if (group!.isEmpty()) {
          group!.destroy();
          taskGroups.delete(ts);
        }
      };
    },

    /**
     * 立即触发指定 targetTime 任务
     */
    emitNow(
      targetTimes?: number | string | Date | Array<number | string | Date>
    ) {
      let times: number[];

      if (targetTimes === undefined) {
        // 不传参数，触发全部任务
        taskGroups.forEach((group) => {
          group.execute();
          taskGroups.delete(group.targetTime);
        });
        return;
      }

      if (!Array.isArray(targetTimes)) {
        times = [normalizeTime(targetTimes)];
      } else {
        times = targetTimes.map(normalizeTime);
      }

      times.forEach((t) => {
        const group = taskGroups.get(t);
        if (group) {
          group.execute();
          taskGroups.delete(t);
        }
      });
    },

    // 新增：获取任务统计
    getStats() {
      return {
        activeTaskGroups: taskGroups.size,
        totalTasks: Array.from(taskGroups.values()).reduce(
          (sum, group) => sum + group.taskSize(),
          0
        ),
      };
    },

    // 新增：获取所有待执行任务
    getPendingTasks() {
      return Array.from(taskGroups.entries()).map(([time, group]) => ({
        targetTime: time,
        taskCount: group.taskSize(),
        remainingMs: time - Date.now(),
      }));
    },

    /**
     * 清理所有任务
     */
    clearAll() {
      taskGroups.forEach((group) => group.destroy());
      taskGroups.clear();
    },
  };
}
