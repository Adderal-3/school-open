import { isTrayExposed } from "../game/engine";
import type { Tray } from "../game/types";
import { TrayCard } from "./TrayCard";

export function GameBoard({ board, onSelect }: { board: Tray[]; onSelect: (id: string) => void }) {
  return (
    <section className="board" aria-label="托盘棋盘">
      <div className="upgrade-row" aria-hidden="true">
        <span className="upgrade-chip upgrade-chip--active">🪙200</span>
        <span className="upgrade-chip">🪙600</span>
        <span className="upgrade-chip">🪙1200</span>
        <span className="upgrade-chip">🪙1800</span>
      </div>
      <div className="board-grid">
        {board.map((tray) => {
          const exposed = isTrayExposed(tray, board);
          return (
            <div
              className="board-tray"
              key={tray.id}
              style={{ left: `${tray.x}%`, top: `${tray.y}%`, zIndex: tray.z }}
            >
              <TrayCard tray={tray} locked={!exposed} onSelect={() => onSelect(tray.id)} />
            </div>
          );
        })}
        {board.length === 0 ? <div className="empty-board">✨ 全部整理完成</div> : null}
        <button className="board-ad board-ad--left">▶ 解锁</button>
        <button className="board-ad board-ad--right">▶ 解锁</button>
      </div>
    </section>
  );
}

