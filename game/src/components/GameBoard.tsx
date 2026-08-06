import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MergeAnimation, Tray } from "../game/types";
import { DrinkCup } from "./DrinkCup";
import { TrayCard } from "./TrayCard";

const FIRST_CUP_DELAY = 160;
const CUP_STAGGER = 360;
const CUP_FLIGHT_DURATION = 430;
const EMPTY_TRAY_EXIT_DURATION = 380;
const GRID_GAP = 7;

const slotOffset = (index: number) => ({
  x: (index % 3 - 1) * 27,
  y: (Math.floor(index / 3) - 0.5) * 22,
});

export function GameBoard({ board, selectedSourceId, draggingSourceId, dragTarget, mergeAnimation, onMergeAnimationComplete, onPlace }: {
  board: Tray[];
  selectedSourceId: string | null;
  draggingSourceId: string | null;
  dragTarget: { col: number; row: number } | null;
  mergeAnimation: MergeAnimation | null;
  onMergeAnimationComplete: () => void;
  onPlace: (trayId: string, col: number, row: number) => void;
}) {
  const activeSourceId = draggingSourceId ?? selectedSourceId;
  const [startedFlights, setStartedFlights] = useState<Set<string>>(() => new Set());
  const [completedFlights, setCompletedFlights] = useState<Set<string>>(() => new Set());
  const onMergeAnimationCompleteRef = useRef(onMergeAnimationComplete);
  onMergeAnimationCompleteRef.current = onMergeAnimationComplete;

  const transfers = useMemo(() => mergeAnimation?.transfers ?? [], [mergeAnimation]);
  const affectedTrayIds = useMemo(() => new Set(transfers.flatMap((transfer) => [transfer.sourceTrayId, transfer.destinationTrayId])), [transfers]);

  useEffect(() => {
    if (!mergeAnimation) {
      setStartedFlights(new Set());
      setCompletedFlights(new Set());
      return;
    }

    setStartedFlights(new Set());
    setCompletedFlights(new Set());
    const timers: number[] = [];
    transfers.forEach((transfer) => {
      const delay = FIRST_CUP_DELAY + transfer.sequence * CUP_STAGGER;
      timers.push(window.setTimeout(() => {
        setStartedFlights((current) => new Set(current).add(transfer.key));
      }, delay));
      timers.push(window.setTimeout(() => {
        setCompletedFlights((current) => new Set(current).add(transfer.key));
      }, delay + CUP_FLIGHT_DURATION));
    });

    const finalDelay = FIRST_CUP_DELAY + Math.max(0, transfers.length - 1) * CUP_STAGGER + CUP_FLIGHT_DURATION + EMPTY_TRAY_EXIT_DURATION;
    timers.push(window.setTimeout(() => onMergeAnimationCompleteRef.current(), finalDelay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [mergeAnimation?.id, transfers]);

  const visibleAnimationDrinks = (tray: Tray) => {
    const removedSlots = new Set(
      transfers
        .filter((transfer) => transfer.sourceTrayId === tray.id && startedFlights.has(transfer.key))
        .map((transfer) => transfer.sourceSlotIndex),
    );
    const incoming = transfers
      .filter((transfer) => transfer.destinationTrayId === tray.id && completedFlights.has(transfer.key))
      .sort((a, b) => a.sequence - b.sequence)
      .map((transfer) => transfer.drink);
    return [...tray.drinks.filter((_, index) => !removedSlots.has(index)), ...incoming].slice(0, 6);
  };

  return (
    <section className="board" aria-label="奶茶托盘棋盘">
      <div className="upgrade-row" aria-hidden="true">
        <span className="upgrade-chip upgrade-chip--active">🪙200</span>
        <span className="upgrade-chip">🪙600</span>
        <span className="upgrade-chip">🪙1200</span>
        <span className="upgrade-chip">🪙1800</span>
      </div>
      <div className={`board-grid${activeSourceId ? " board-grid--ready" : ""}`} data-testid="board-grid">
        {Array.from({ length: 20 }, (_, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const adCell = row === 4 && (col === 0 || col === 3);
          const occupied = board.some((tray) => tray.col === col && tray.row === row);
          const dragHovered = dragTarget?.col === col && dragTarget.row === row;
          return (
            <button
              className={`board-cell${occupied ? " board-cell--occupied" : ""}${dragHovered ? " board-cell--drag-target" : ""}`}
              key={`cell-${col}-${row}`}
              type="button"
              data-board-cell
              data-col={col}
              data-row={row}
              data-occupied={occupied || adCell ? "true" : "false"}
              data-testid={`board-cell-${col}-${row}`}
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
              disabled={occupied || adCell || !activeSourceId}
              onClick={() => selectedSourceId && onPlace(selectedSourceId, col, row)}
              aria-label={adCell ? "广告解锁位" : occupied ? "已放置托盘" : `棋盘第 ${row + 1} 行第 ${col + 1} 列`}
            />
          );
        })}

        {board.map((tray) => (
          <div
            className={`board-tray${affectedTrayIds.has(tray.id) ? " board-tray--merge-hidden" : ""}`}
            key={tray.id}
            style={{ gridColumn: tray.col + 1, gridRow: tray.row + 1 }}
            data-testid={`board-${tray.id}`}
          >
            <TrayCard tray={tray} />
          </div>
        ))}

        {mergeAnimation?.trays.filter((tray) => affectedTrayIds.has(tray.id)).map((tray) => {
          const displayDrinks = visibleAnimationDrinks(tray);
          const outgoing = transfers.filter((transfer) => transfer.sourceTrayId === tray.id);
          const incoming = transfers.filter((transfer) => transfer.destinationTrayId === tray.id);
          const outgoingComplete = outgoing.length > 0 && outgoing.every((transfer) => completedFlights.has(transfer.key));
          const incomingComplete = incoming.length > 0 && incoming.every((transfer) => completedFlights.has(transfer.key));
          const empty = displayDrinks.length === 0 && outgoingComplete;
          const sold = mergeAnimation.soldTrayIds.includes(tray.id) && incomingComplete;
          return (
            <div
              className={`board-tray merge-source-tray${empty ? " merge-source-tray--empty" : ""}${sold ? " merge-destination-tray--complete" : ""}`}
              key={`merge-tray-${tray.id}`}
              style={{ gridColumn: tray.col + 1, gridRow: tray.row + 1 }}
              data-testid={`merge-tray-${tray.id}`}
              aria-hidden="true"
            >
              <TrayCard tray={tray} merging displayDrinks={displayDrinks} />
            </div>
          );
        })}

        {transfers.map((transfer) => {
          const sourceSlot = slotOffset(transfer.sourceSlotIndex);
          const destinationSlot = slotOffset(transfer.destinationSlotIndex);
          const colDelta = transfer.destinationCol - transfer.sourceCol;
          const rowDelta = transfer.destinationRow - transfer.sourceRow;
          const flightX = `calc(${colDelta * 100}% + ${colDelta * GRID_GAP + destinationSlot.x - sourceSlot.x}px)`;
          const flightY = `calc(${rowDelta * 100}% + ${rowDelta * GRID_GAP + destinationSlot.y - sourceSlot.y}px)`;
          const flightXMid = `calc(${colDelta * 50}% + ${(colDelta * GRID_GAP + destinationSlot.x - sourceSlot.x) * 0.5}px)`;
          const flightYMid = `calc(${rowDelta * 50}% + ${(rowDelta * GRID_GAP + destinationSlot.y - sourceSlot.y) * 0.5 - 20}px)`;
          return (
            <div
              className="merge-cup-flight"
              key={transfer.key}
              style={{
                gridColumn: transfer.sourceCol + 1,
                gridRow: transfer.sourceRow + 1,
                left: `calc(50% + ${sourceSlot.x}px)`,
                top: `calc(50% + ${sourceSlot.y}px)`,
                "--flight-x": flightX,
                "--flight-y": flightY,
                "--flight-x-mid": flightXMid,
                "--flight-y-mid": flightYMid,
                "--flight-delay": `${FIRST_CUP_DELAY + transfer.sequence * CUP_STAGGER}ms`,
              } as CSSProperties}
              data-testid="merge-cup-flight"
              data-drink={transfer.drink}
              aria-hidden="true"
            >
              <DrinkCup type={transfer.drink} />
            </div>
          );
        })}

        <button className="board-ad board-ad--left" type="button">▶ 解锁</button>
        <button className="board-ad board-ad--right" type="button">▶ 解锁</button>
      </div>
    </section>
  );
}
