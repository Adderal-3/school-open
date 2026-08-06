import { GearIcon, ReloadIcon } from "@radix-ui/react-icons";
import { DRINKS } from "../game/config";
import type { CustomerOrder } from "../game/types";
import { DrinkCup } from "./DrinkCup";

export function ShopHeader({
  coins,
  level,
  progress,
  orders,
  onRestart,
}: {
  coins: number;
  level: number;
  progress: number;
  orders: CustomerOrder[];
  onRestart: () => void;
}) {
  return (
    <>
      <section className="shop-scene" aria-label="饮品店顾客区">
        <div className="awning" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="top-hud">
          <button className="icon-button" aria-label="设置"><GearIcon /></button>
          <span className="coin-pill">🪙 <strong>{coins}</strong></span>
          <span className="level-badge"><b>{level}</b><small>级解锁新城市</small></span>
          <button className="tiny-gift" aria-label="奖励">🎁</button>
        </div>
        <button className="refresh-button" onClick={onRestart}><ReloadIcon /> 刷新</button>
        <div className="customers">
          {orders.map((order) => <span className="customer" key={order.id}>{order.avatar}</span>)}
        </div>
        <div className="progress-wrap" aria-label={`关卡进度 ${progress}%`}>
          <span>🐥</span>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          <b>{progress}%</b>
        </div>
      </section>
      <section className="orders-bar" aria-label="当前订单">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <DrinkCup type={order.drink} small />
            <span><b>{DRINKS[order.drink].shortName}</b><small>×1</small></span>
          </div>
        ))}
        <button className="unlock-ad" type="button">▶ 解锁</button>
      </section>
    </>
  );
}

