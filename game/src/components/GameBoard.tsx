import type { Tray } from "../game/types";
import { TrayCard } from "./TrayCard";

export function GameBoard({ board, selectedSourceId, onPlace }: {
  board: Tray[];
  selectedSourceId: string | null;
  onPlace: (trayId: string, col: number, row: number) => void;
}) {
  return (
    <section className="board" aria-label="奶茶托盘棋盘">
      <div className="upgrade-row" aria-hidden="true">
        <span className="upgrade-chip upgrade-chip--active">🪙200</span>
        <span className="upgrade-chip">🪙600</span>
        <span className="upgrade-chip">🪙1200</span>
        <span className="upgrade-chip">🪙1800</span>
      </div>
      <div className={`board-grid${selectedSourceId ? " board-grid--ready" : ""}`} data-testid="board-grid">
        {Array.from({ length: 20 }, (_, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const adCell = row === 4 && (col === 0 || col === 3);
          const occupied = board.some((tray) => tray.col === col && tray.row === row);
          return (
            <button
              className="board-cell"
              key={`cell-${col}-${row}`}
              type="button"
              data-board-cell
              data-col={col}
              data-row={row}
              data-occupied={occupied || adCell ? "true" : "false"}
              data-testid={`board-cell-${col}-${row}`}
              disabled={occupied || adCell || !selectedSourceId}
              onClick={() => selectedSourceId && onPlace(selectedSourceId, col, row)}
              aria-label={adCell ? "广告解锁位" : occupied ? "已放置托盘" : `棋盘第 ${row + 1} 行第 ${col + 1} 列`}
            />
          );
        })}

        {board.map((tray) => (
          <div className="board-tray" key={tray.id} style={{ gridColumn: tray.col + 1, gridRow: tray.row + 1 }} data-testid={`board-${tray.id}`}>
            <TrayCard tray={tray} />
          </div>
        ))}

        <button className="board-ad board-ad--left" type="button">▶ 解锁</button>
        <button className="board-ad board-ad--right" type="button">▶ 解锁</button>
      </div>
    </section>
  );
}
