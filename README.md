# time-trigger

高精度、策略优化的浏览器端一次性定时器工具（TypeScript）。  
支持按目标时间触发任务、自动修复前端定时器漂移、相同时间任务共享定时器，并提供取消和立即触发功能。

---

## 🔹 特性

- 一次性任务触发，触发后自动销毁  
- 精确到秒，自动修复前端定时器漂移  
- 相同 `targetTime` 的任务共用一个定时器，性能优化  
- 支持取消任务、立即触发指定任务或所有任务  
- TypeScript 类型安全，支持浏览器环境  

---

## 💿 安装

```bash
# 使用 npm
npm install time-trigger

# 使用 yarn
yarn add time-trigger
```

## 使用示例

```ts
import { createTimeTrigger } from 'time-trigger';

const timeTrigger = createTimeTrigger();

// 注册 3 秒后任务
const cancel3s = timeTrigger.once(Date.now() + 3000, () => {
  console.log('3 秒后触发');
});

// 注册 5 秒后任务
timeTrigger.once(Date.now() + 5000, () => {
  console.log('5 秒后触发');
});

// 立即触发指定任务
timeTrigger.emitNow(Date.now() + 5000);

// 立即触发多个任务
timeTrigger.emitNow([Date.now() + 3000, Date.now() + 5000]);

// 取消任务
cancel3s();

// 清理所有任务
timeTrigger.clearAll();
```

## API

### `createTimeTrigger()`

创建一个时间触发器实例。

#### 方法

`once(targetTime, callback)`

注册一次性任务。

- 参数
  - targetTime: number | string | Date - 目标时间
  - callback: () => void - 任务回调
- 返回值
  - () => void - 取消函数，用于取消未触发的任务
  
---

`emitNow(targetTimes?)`

立即触发任务。

- 参数（可选）
  - targetTimes: number | string | Date | Array<number | string | Date>
  - 单个时间、时间数组或不传（触发所有任务）
- 返回值
  - void

---

`clearAll()`

清理所有未触发任务。

- 返回值
  - void
