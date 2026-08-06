import type { Tray } from "../game/types";
import { TrayCard } from "./TrayCard";

export function StagingBar({ staging }: { staging: Tray[] }) {
  return (
    <section className="staging-bar" aria-label="备餐台">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="staging-slot" key={index}>
          {staging[index] ? <TrayCard tray={staging[index]} staging /> : null}
        </div>
      ))}
    </section>
  );
}

