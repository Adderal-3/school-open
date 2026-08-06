import type { KeyboardEventHandler, PointerEventHandler } from "react";
import { DRINKS } from "../game/config";
import type { DrinkType, SourceTray, Tray } from "../game/types";
import { DrinkCup } from "./DrinkCup";

const describeDrinks = (drinks: DrinkType[]) => {
  const counts = new Map<DrinkType, number>();
  drinks.forEach((drink) => counts.set(drink, (counts.get(drink) ?? 0) + 1));
  return [...counts.entries()].map(([drink, count]) => `${DRINKS[drink].shortName}${count}杯`).join("、");
};

export function TrayCard({ tray, staging = false, dragging = false, merging = false, displayDrinks, onActivate, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: {
  tray: Tray | SourceTray;
  staging?: boolean;
  dragging?: boolean;
  merging?: boolean;
  displayDrinks?: DrinkType[];
  onActivate?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
}) {
  const renderedDrinks = displayDrinks ?? tray.drinks;
  const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if ((event.key === "Enter" || event.key === " ") && onActivate) {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <button
      className={`tray-card${staging ? " tray-card--staging" : ""}${dragging ? " tray-card--dragging" : ""}${merging ? " tray-card--merging" : ""}`}
      onClick={(event) => event.detail === 0 && onActivate?.()}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      disabled={!onActivate && !onPointerDown}
      aria-label={`${describeDrinks(renderedDrinks)}的托盘${staging ? "，拖到棋盘" : ""}`}
      aria-pressed={dragging || undefined}
      data-testid={staging ? `source-${tray.id}` : undefined}
    >
      <span className="tray-card__slots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span className="tray-slot" key={index}>
            {renderedDrinks[index] ? <DrinkCup type={renderedDrinks[index]} small={staging} /> : null}
          </span>
        ))}
      </span>
      <span className="tray-count" aria-hidden="true">{renderedDrinks.length}/6</span>
    </button>
  );
}
