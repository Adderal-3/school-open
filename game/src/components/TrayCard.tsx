import type { KeyboardEventHandler, PointerEventHandler } from "react";
import { DRINKS } from "../game/config";
import type { SourceTray, Tray } from "../game/types";
import { DrinkCup } from "./DrinkCup";

export function TrayCard({ tray, staging = false, dragging = false, onActivate, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: {
  tray: Tray | SourceTray;
  staging?: boolean;
  dragging?: boolean;
  onActivate?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
}) {
  const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if ((event.key === "Enter" || event.key === " ") && onActivate) {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <button className={`tray-card${staging ? " tray-card--staging" : ""}${dragging ? " tray-card--dragging" : ""}`} onClick={(event) => event.detail === 0 && onActivate?.()} onKeyDown={handleKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} disabled={!onActivate && !onPointerDown} aria-label={`${DRINKS[tray.drink].name}托盘，${tray.count}杯${staging ? "，拖到棋盘" : ""}`} aria-pressed={dragging || undefined} data-testid={staging ? `source-${tray.id}` : undefined}>
      <span className="tray-card__slots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span className="tray-slot" key={index}>{index < tray.count ? <DrinkCup type={tray.drink} small={staging} /> : null}</span>)}
      </span>
      <span className="tray-count" aria-hidden="true">{tray.count}/6</span>
    </button>
  );
}
