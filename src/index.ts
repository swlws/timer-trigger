import { TickStrategyResolver } from './strategies';
import { TimeTriggerTaskGroup } from './taskGroup';
import { normalizeTime } from './utils';

export function createTimeTrigger() {
  const resolver = new TickStrategyResolver();
  const taskGroups = new Map<number, TimeTriggerTaskGroup>();

  return {
    /**
     * 注册一次性时间触发任务
     */
    on(targetTime: number | string | Date, callback: () => void) {
      const ts = normalizeTime(targetTime);

      let group = taskGroups.get(ts);
      if (!group) {
        group = new TimeTriggerTaskGroup(ts, new Set(), resolver);
        taskGroups.set(ts, group);
      }

      const wrappedCallback = () => {
        try {
          callback();
        } finally {
          taskGroups.delete(ts);
        }
      };

      group.addTask(wrappedCallback);

      // 返回取消函数
      return () => {
        group!.destroy();
        taskGroups.delete(ts);
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

    /**
     * 清理所有任务
     */
    clearAll() {
      taskGroups.forEach((group) => group.destroy());
      taskGroups.clear();
    },
  };
}
