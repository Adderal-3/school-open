# 同色托盘合并小游戏：技术架构

## 技术选型

- React + TypeScript + Vite：适合快速验证网页小游戏，组件拆分清晰。
- DOM + CSS：当前是规则和布局原型，不需要引入 Cocos 或 Canvas；后续若出现大量粒子、骨骼动画或复杂物理，再评估迁移。
- `useReducer` 状态机：所有规则通过 action 推进，交互动画不直接修改业务状态。
- Vitest：覆盖放置、四向连接、异色隔离、占位校验与订单售出。

## 模块边界

- `game/src/game/types.ts`：托盘、来源队列、订单和整局状态类型。
- `game/src/game/config.ts`：六种颜色、素材映射和容量常量；后续换书本主题主要改这里和展示组件。
- `game/src/game/levels.ts`：关卡发放序列与订单序列。
- `game/src/game/engine.ts`：纯规则层，负责放置校验、连通组搜索、合并、售出、补充托盘和道具。
- `game/src/components/GameBoard.tsx`：始终存在的 4×5 棋盘和点击落点。
- `game/src/components/StagingBar.tsx`：下方三个待放托盘与指针拖放。
- `game/src/components/TrayCard.tsx`：单色 6 槽托盘展示。
- `game/src/Prototype.tsx`：页面编排和 action 派发。

## 核心数据模型

- `SourceTray`：下方尚未放置的单色托盘，只包含 `drink` 和 `count`。
- `Tray`：已放入棋盘的单色托盘，比 `SourceTray` 多 `col`、`row` 坐标。
- `GameState.source`：当前可见的三个待放托盘。
- `GameState.reserve`：后续发放队列。
- `GameState.board`：棋盘上的托盘集合；空格不需要单独持久化，可由坐标推导。
- `CustomerOrder`：当前顾客所需颜色。

## 一次放置的状态流

1. 校验托盘仍在 `source` 中。
2. 校验目标坐标在 4×5 范围内、不是保留格且没有托盘。
3. 把来源托盘转成带坐标的棋盘托盘。
4. 从新托盘开始执行同色四向连通搜索（BFS）。
5. 汇总连通组数量，并把连通组收敛为一个托盘。
6. 数量达到 6 且命中当前订单时，移除完整托盘、结算奖励并补充新订单。
7. 从 `reserve` 补一个托盘到下方，使可见数量保持为 3。

## 扩展约束

- 主题素材和玩法规则分离：奶茶换成书本时，不改连通与订单算法。
- 关卡数据和规则引擎分离：未来障碍物、棋盘形状、限步条件由关卡配置注入。
- 拖放只是输入方式：真实状态变化只发生在 `PLACE_TRAY` action 中。
- 动画不参与判定，避免快速拖动或动画中断导致状态错误。
