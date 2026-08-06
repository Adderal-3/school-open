import { useEffect, useReducer } from "react";
import { DRINKS } from "./game/config";
import { createInitialState, gameReducer } from "./game/engine";
import { GameBoard } from "./components/GameBoard";
import { ShopHeader } from "./components/ShopHeader";
import { StagingBar } from "./components/StagingBar";
import { ToolBar } from "./components/ToolBar";

export default function Prototype() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    if (!state.reward) return;
    const timeout = window.setTimeout(() => dispatch({ type: "DISMISS_REWARD" }), 1050);
    return () => window.clearTimeout(timeout);
  }, [state.reward]);

  return (
      <main className="game" data-testid="drink-sort-game">
        <ShopHeader
          coins={state.coins}
          level={state.level}
          progress={state.progress}
          orders={state.orders}
          onRestart={() => dispatch({ type: "RESTART" })}
        />

        <div className="message-strip" role="status">
          <span>{state.combo > 1 ? `🔥 ${state.combo} 连击 · ` : ""}{state.message}</span>
        </div>

        <GameBoard board={state.board} onSelect={(trayId) => dispatch({ type: "SELECT_TRAY", trayId })} />
        <StagingBar staging={state.staging} />
        <ToolBar
          counts={state.tools}
          onReshuffle={() => dispatch({ type: "RESHUFFLE" })}
          onRemove={() => dispatch({ type: "REMOVE_ONE" })}
          onClear={() => dispatch({ type: "CLEAR_ROW" })}
        />

        {state.reward ? (
          <div className="floating-reward" key={state.reward.id}>
            <b>Good!</b>
            <span>{DRINKS[state.reward.type].emoji} +{state.reward.coins} 🪙</span>
          </div>
        ) : null}

        {state.phase !== "playing" ? (
          <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
            <section className={`result-card result-card--${state.phase}`}>
              <div className="result-mascot">{state.phase === "won" ? "🐯" : "🐹"}</div>
              <h1 id="result-title">{state.phase === "won" ? "升级奖励" : "备餐台满啦"}</h1>
              <p>{state.phase === "won" ? "你解锁了新的栗香拿铁！" : "先凑齐同类饮品，就能腾出更多位置。"}</p>
              <div className="new-drink">{state.phase === "won" ? "☕" : "💡"}</div>
              <strong>{state.phase === "won" ? "栗香拿铁" : "整理小提示"}</strong>
              <span>本关奖励：🪙 {state.phase === "won" ? 70 : 0}</span>
              <button onClick={() => dispatch({ type: "RESTART" })}>
                {state.phase === "won" ? "再玩一关" : "重新挑战"}
              </button>
            </section>
          </div>
        ) : null}
      </main>
  );
}
