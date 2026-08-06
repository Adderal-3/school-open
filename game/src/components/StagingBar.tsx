import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { SourceTray } from "../game/types";
import { TrayCard } from "./TrayCard";

interface DragState {
  trayId: string;
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

export function StagingBar({ source, selectedSourceId, onSelect, onPlace }: {
  source: SourceTray[];
  selectedSourceId: string | null;
  onSelect: (trayId: string) => void;
  onPlace: (trayId: string, col: number, row: number) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const moveDrag = (event: PointerEvent) => {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    const next = { ...current, dx, dy, moved: current.moved || Math.hypot(dx, dy) > 6 };
    dragRef.current = next;
    setDrag(next);
  };

  const finishDrag = (event: PointerEvent) => {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const target = Array.from(document.querySelectorAll<HTMLElement>("[data-board-cell]")).find((cell) => {
      const bounds = cell.getBoundingClientRect();
      return cell.dataset.occupied !== "true" && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    });
    if (target) onPlace(current.trayId, Number(target.dataset.col), Number(target.dataset.row));
    else if (!current.moved) onSelect(current.trayId);
    dragRef.current = null;
    setDrag(null);
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", cancelDrag);
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDrag(null);
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", cancelDrag);
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, trayId: string) => {
    event.preventDefault();
    const next = { trayId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false };
    dragRef.current = next;
    setDrag(next);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", cancelDrag);
  };

  return (
    <section className="staging-bar" aria-label="待放托盘区" data-testid="source-rack">
      <div className="staging-title"><b>待放托盘</b><span>拖到上方空格 · 同色相邻自动合并</span></div>
      <div className="staging-slots">
        {Array.from({ length: 3 }, (_, index) => {
          const tray = source[index];
          const dragging = tray && drag?.trayId === tray.id;
          return (
            <div className={`staging-slot${tray?.id === selectedSourceId ? " staging-slot--selected" : ""}${dragging ? " staging-slot--dragging" : ""}`} key={index} style={{ transform: dragging ? `translate3d(${drag.dx}px, ${drag.dy}px, 0)` : undefined }}>
              {tray ? (
                <TrayCard tray={tray} staging dragging={Boolean(dragging)} onActivate={() => onSelect(tray.id)} onPointerDown={(event) => startDrag(event, tray.id)} />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
