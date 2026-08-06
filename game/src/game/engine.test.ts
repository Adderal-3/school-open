import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer, isTrayExposed } from "./engine";

describe("drink tray game engine", () => {
  it("does not allow a covered tray to be selected", () => {
    const state = createInitialState();
    const covered = state.board.find((tray) => !isTrayExposed(tray, state.board));
    expect(covered).toBeDefined();

    const next = gameReducer(state, { type: "SELECT_TRAY", trayId: covered!.id });

    expect(next.board).toHaveLength(state.board.length);
    expect(next.message).toContain("压着");
  });

  it("can clear the deterministic level by repeatedly choosing an exposed tray", () => {
    let state = createInitialState();
    let turns = 0;

    while (state.phase === "playing" && turns < 20) {
      const exposed = state.board.find((tray) => isTrayExposed(tray, state.board));
      expect(exposed).toBeDefined();
      state = gameReducer(state, { type: "SELECT_TRAY", trayId: exposed!.id });
      turns += 1;
    }

    expect(state.phase).toBe("won");
    expect(state.board).toHaveLength(0);
    expect(state.staging).toHaveLength(0);
    expect(state.coins).toBeGreaterThan(550);
    expect(state.progress).toBeGreaterThan(16);
  });

  it("consumes each helper tool at most once", () => {
    const initial = createInitialState();
    const shuffled = gameReducer(initial, { type: "RESHUFFLE" });
    const removed = gameReducer(shuffled, { type: "REMOVE_ONE" });
    const cleared = gameReducer(removed, { type: "CLEAR_ROW" });

    expect(shuffled.tools.reshuffle).toBe(0);
    expect(removed.tools.removeOne).toBe(0);
    expect(cleared.tools.clearRow).toBe(0);
    expect(cleared.board.length).toBeLessThan(initial.board.length);
  });
});

