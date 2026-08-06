import { useEffect, useReducer, useState } from "react";
import { DRINKS, LEVEL_SALES_TARGET } from "./game/config";
import { createInitialState, gameReducer, planPlacement } from "./game/engine";
import { DEMO_LEVELS } from "./game/levels";
import type { DemoLevelId, MergeAnimation } from "./game/types";
import { GameBoard } from "./components/GameBoard";
import { ShopHeader } from "./components/ShopHeader";
import { StagingBar } from "./components/StagingBar";
import { ToolBar } from "./components/ToolBar";

export default function Prototype() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [draggingSourceId, setDraggingSourceId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ col: number; row: number } | null>(null);
  const [mergeAnimation, setMergeAnimation] = useState<MergeAnimation | null>(null);

  useEffect(() => {
    if (!state.reward) return;
    const timeout = window.setTimeout(() => dispatch({ type: "DISMISS_REWARD" }), 1050);
    return () => window.clearTimeout(timeout);
  }, [state.reward]);

  const place = (trayId: string, col: number, row: number) => {
    const plan = planPlacement(state, trayId, col, row);
    if (plan.animation) setMergeAnimation(plan.animation);
    dispatch({ type: "PLACE_TRAY", trayId, col, row });
  };

  const restart = () => {
    setMergeAnimation(null);
    setDraggingSourceId(null);
    setDragTarget(null);
    dispatch({ type: "RESTART" });
  };

  const selectLevel = (levelId: DemoLevelId) => {
    setMergeAnimation(null);
    setDraggingSourceId(null);
    setDragTarget(null);
    dispatch({ type: "SELECT_LEVEL", levelId });
  };

  const won = state.phase === "won";

  return (
    <main className="game" data-testid="drink-sort-game">
      <ShopHeader coins={state.coins} level={state.level} progress={state.progress} orders={state.orders} onRestart={restart} />
      <nav className="demo-level-switcher" aria-label="Demo 关卡选择">
        {(Object.keys(DEMO_LEVELS) as DemoLevelId[]).map((levelId) => {
          const level = DEMO_LEVELS[levelId];
          const active = state.demoLevelId === levelId;
          return (
            <button
              key={levelId}
              className={active ? "demo-level-button demo-level-button--active" : "demo-level-button"}
              data-testid={`demo-level-${levelId}`}
              type="button"
              aria-pressed={active}
              onClick={() => selectLevel(levelId)}
            >
              <b>{level.name}</b>
              <span>{levelId === "pure" ? "基础合并" : "多色分类"}</span>
            </button>
          );
        })}
      </nav>
      <div className="message-strip" role="status"><span>{state.combo > 1 ? `🔥 ${state.combo} 连击 · ` : ""}{state.message}</span></div>
      <GameBoard
        board={state.board}
        selectedSourceId={state.selectedSourceId}
        draggingSourceId={draggingSourceId}
        dragTarget={dragTarget}
        mergeAnimation={mergeAnimation}
        onMergeAnimationComplete={() => setMergeAnimation(null)}
        onPlace={place}
      />
      <StagingBar
        source={state.source}
        selectedSourceId={state.selectedSourceId}
        onSelect={(trayId) => dispatch({ type: "SELECT_SOURCE", trayId })}
        onPlace={place}
        onDragStateChange={(trayId, target) => {
          setDraggingSourceId(trayId);
          setDragTarget(target);
        }}
      />
      <ToolBar counts={state.tools} onReshuffle={() => dispatch({ type: "RESHUFFLE" })} onRemove={() => dispatch({ type: "REMOVE_ONE" })} onClear={() => dispatch({ type: "CLEAR_ROW" })} />

      {state.reward ? <div className="floating-reward" key={state.reward.id}><b>售出!</b><span>{DRINKS[state.reward.type].emoji} +{state.reward.coins} 🪙</span></div> : null}

      {state.phase !== "playing" ? (
        <div className="result-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title" data-testid={`result-${state.phase}`}>
          <section className={`result-card result-card--${state.phase}`}>
            <div className="result-mascot">{won ? "🐯" : "😿"}</div>
            <h1 id="result-title">{won ? "全部订单完成" : "本关未完成"}</h1>
            <p>{won ? "所有托盘都已正确合并并交给顾客。" : "待放托盘已经用完，剩余订单无法继续完成。"}</p>
            <div className="new-drink">{won ? "🧋" : "🥤"}</div>
            <strong>{won ? "本关完成" : "订单未达标"}</strong>
            <span>已完成订单：{state.sold}/{LEVEL_SALES_TARGET}</span>
            <button onClick={restart}>{won ? "再玩一关" : "重新挑战"}</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
