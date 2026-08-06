# 饮品托盘消除小游戏

一个参考竖屏饮品整理玩法制作的可交互网页小游戏。无需安装，打开网页即可游玩。

## 在线试玩

GitHub Pages：<https://adderal-3.github.io/school-open/>

## 已实现

- 托盘遮挡与逐层解锁
- 三格备餐区与同类饮品自动归并
- 集齐 6 杯完成交付
- 顾客订单、金币、进度和升级结算
- 重新发放、移除一个、清除一列三种道具
- 胜利、失败和重新挑战流程

详细玩法见 [GAMEPLAY.md](./GAMEPLAY.md)，技术架构见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

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

