import type { Tray } from "../game/types";
import { DrinkCup } from "./DrinkCup";

export function TrayCard({
  tray,
  locked = false,
  staging = false,
  onSelect,
}: {
  tray: Tray;
  locked?: boolean;
  staging?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      className={`tray-card${locked ? " tray-card--locked" : ""}${staging ? " tray-card--staging" : ""}`}
      onClick={onSelect}
      disabled={locked || !onSelect}
      aria-label={locked ? "被上层托盘遮挡" : "选择饮品托盘"}
    >
      <span className="tray-card__slots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span className="tray-slot" key={index}>
            {tray.drinks[index] ? <DrinkCup type={tray.drinks[index]} small={staging} /> : null}
          </span>
        ))}
      </span>
      {locked ? <span className="tray-card__lock">🔒</span> : null}
    </button>
  );
}

