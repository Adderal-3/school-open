import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { SourceTray } from "../game/types";
import { TrayCard } from "./TrayCard";

interface DragState {
  trayId: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  clientX: number;
  clientY: number;
  grabX: number;
  grabY: number;
  previewWidth: number;
  previewHeight: number;
  target: { col: number; row: number } | null;
}

const findDropTarget = (clientX: number, clientY: number, previousClientX: number, previousClientY: number) => {
  const preview = document.querySelector<HTMLElement>("[data-testid='tray-drag-ghost']");
  const previewBounds = preview?.getBoundingClientRect();
  const dropX = previewBounds ? previewBounds.left + previewBounds.width / 2 + clientX - previousClientX : clientX;
  const dropY = previewBounds ? previewBounds.top + previewBounds.height / 2 + clientY - previousClientY : clientY;
  const cell = Array.from(document.querySelectorAll<HTMLElement>("[data-board-cell]")).find((candidate) => {
    const bounds = candidate.getBoundingClientRect();
    return candidate.dataset.occupied !== "true" && dropX >= bounds.left && dropX <= bounds.right && dropY >= bounds.top && dropY <= bounds.bottom;
  });
  return cell ? { col: Number(cell.dataset.col), row: Number(cell.dataset.row) } : null;
};

export function StagingBar({ source, selectedSourceId, onSelect, onPlace, onDragStateChange }: {
  source: SourceTray[];
  selectedSourceId: string | null;
  onSelect: (trayId: string) => void;
  onPlace: (trayId: string, col: number, row: number) => void;
  onDragStateChange: (trayId: string | null, target: { col: number; row: number } | null) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPlaceRef = useRef(onPlace);
  const onDragStateChangeRef = useRef(onDragStateChange);
  onSelectRef.current = onSelect;
  onPlaceRef.current = onPlace;
  onDragStateChangeRef.current = onDragStateChange;

  useEffect(() => {
    const clearDrag = () => {
      dragRef.current = null;
      setDrag(null);
      onDragStateChangeRef.current(null, null);
    };

    const moveDrag = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      const moved = current.moved || Math.hypot(dx, dy) > 8;
      const target = moved ? findDropTarget(event.clientX, event.clientY, current.clientX, current.clientY) : null;
      const next = { ...current, moved, clientX: event.clientX, clientY: event.clientY, target };
      dragRef.current = next;
      setDrag(next);
      onDragStateChangeRef.current(moved ? current.trayId : null, target);
    };

    const finishDrag = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const target = current.moved ? findDropTarget(event.clientX, event.clientY, current.clientX, current.clientY) : null;
      clearDrag();
      if (target) onPlaceRef.current(current.trayId, target.col, target.row);
      else if (!current.moved) onSelectRef.current(current.trayId);
    };

    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", clearDrag);
    return () => {
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", clearDrag);
    };
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, trayId: string) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const boardCellBounds = document.querySelector<HTMLElement>("[data-board-cell]")?.getBoundingClientRect();
    const previewWidth = boardCellBounds ? boardCellBounds.width * 0.78 : bounds.width * 0.7;
    const next = {
      trayId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      clientX: event.clientX,
      clientY: event.clientY,
      grabX: (event.clientX - bounds.left) / bounds.width,
      grabY: (event.clientY - bounds.top) / bounds.height,
      previewWidth,
      previewHeight: previewWidth / 1.6,
      target: null,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const draggedTray = drag ? source.find((tray) => tray.id === drag.trayId) : null;
  const dragPreview = drag && draggedTray ? createPortal(
    <div
      className={`tray-drag-ghost${drag.moved ? " tray-drag-ghost--visible" : ""}`}
      style={{
        left: drag.clientX,
        top: drag.clientY,
        width: drag.previewWidth,
        height: drag.previewHeight,
        "--tray-grab-x": `${-drag.grabX * 100}%`,
        "--tray-grab-y": `${-drag.grabY * 100}%`,
      } as CSSProperties}
      aria-hidden="true"
      data-testid="tray-drag-ghost"
    >
      <TrayCard tray={draggedTray} dragging />
    </div>,
    document.body,
  ) : null;

  return (
    <section className="staging-bar" aria-label="待放托盘区" data-testid="source-rack">
      <div className="staging-title"><b>待放托盘</b><span>拖到上方空格 · 同色相邻自动合并</span></div>
      <div className="staging-slots">
        {Array.from({ length: 3 }, (_, index) => {
          const tray = source[index];
          const dragging = tray && drag?.trayId === tray.id;
          return (
            <div className={`staging-slot${tray?.id === selectedSourceId ? " staging-slot--selected" : ""}${dragging ? " staging-slot--dragging" : ""}`} key={tray?.id ?? `empty-${index}`}>
              {tray ? (
                <TrayCard
                  tray={tray}
                  staging
                  dragging={Boolean(dragging)}
                  onActivate={() => onSelect(tray.id)}
                  onPointerDown={(event) => startDrag(event, tray.id)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {dragPreview}
    </section>
  );
}
