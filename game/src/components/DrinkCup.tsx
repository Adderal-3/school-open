import { DRINKS } from "../game/config";
import type { DrinkType } from "../game/types";

export function DrinkCup({ type, small = false }: { type: DrinkType; small?: boolean }) {
  const drink = DRINKS[type];
  const mark = type === "matcha" ? "♡" : type === "vanilla" ? "●" : "〰";
  return (
    <span className={`drink-cup drink-cup--${type}${small ? " drink-cup--small" : ""}`} aria-label={drink.name}>
      <span className="drink-cup__foam">{mark}</span>
    </span>
  );
}
