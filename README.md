# 同色托盘合并小游戏

一个参考原版布局制作的可交互 HTML 小游戏原型。玩家把下方单色托盘拖到棋盘，相同颜色上下或左右相邻时自动合并；集满 6 个并命中顾客订单后自动售出。

当前版本已经实现：

- 始终存在的 4×5 大格棋盘；
- 下方三个单色托盘的真实拖放；
- 六种颜色的发放队列；
- 四向同色连通、自动吸收与整盘售出；
- 顾客订单、金币、进度和基础道具；
- 点击托盘后再点棋盘格的备用操作；
- 核心规则自动测试。

当前不实现障碍物和复杂关卡建模，等玩法与主题确定后再加入。

详细规则见 [GAMEPLAY.md](./GAMEPLAY.md)，技术拆分见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 本地运行

```bash
cd game
npm install
npm run dev
```

## 验证

```bash
cd game
npm run test:game
npm run build:pages
```
