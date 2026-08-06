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

  const place = (trayId: string, col: number, row: number) => dispatch({ type: "PLACE_TRAY", trayId, col, row });

  return (
    <main className="game" data-testid="drink-sort-game">
      <ShopHeader coins={state.coins} level={state.level} progress={state.progress} orders={state.orders} onRestart={() => dispatch({ type: "RESTART" })} />
      <div className="message-strip" role="status"><span>{state.combo > 1 ? `🔥 ${state.combo} 连击 · ` : ""}{state.message}</span></div>
      <GameBoard board={state.board} selectedSourceId={state.selectedSourceId} onPlace={place} />
      <StagingBar source={state.source} selectedSourceId={state.selectedSourceId} onSelect={(trayId) => dispatch({ type: "SELECT_SOURCE", trayId })} onPlace={place} />
      <ToolBar counts={state.tools} onReshuffle={() => dispatch({ type: "RESHUFFLE" })} onRemove={() => dispatch({ type: "REMOVE_ONE" })} onClear={() => dispatch({ type: "CLEAR_ROW" })} />

      {state.reward ? <div className="floating-reward" key={state.reward.id}><b>售出!</b><span>{DRINKS[state.reward.type].emoji} +{state.reward.coins} 🪙</span></div> : null}

      {state.phase !== "playing" ? (
        <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <section className={`result-card result-card--${state.phase}`}>
            <div className="result-mascot">🐥</div><h1 id="result-title">全部订单完成</h1><p>所有同色托盘都已合并并交给顾客。</p><div className="new-drink">🧋</div><strong>本关完成</strong><span>本关奖励：🪙70</span><button onClick={() => dispatch({ type: "RESTART" })}>再玩一关</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
