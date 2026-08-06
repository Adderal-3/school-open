import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer, isCellAvailable } from "./engine";
import type { GameState, SourceTray } from "./types";

const withSource = (state: GameState, source: SourceTray[]): GameState => ({
  ...state,
  source,
  reserve: [],
});

describe("drink tray placement game", () => {
  it("starts with a persistent empty 4x5 board and three pure-color trays", () => {
    const state = createInitialState();
    expect(state.board).toHaveLength(0);
    expect(state.source).toHaveLength(3);
    expect(state.source.every((tray) => tray.count === 2)).toBe(true);
    expect(new Set(state.source.map((tray) => tray.drink)).size).toBe(3);
    expect(isCellAvailable(state, 1, 1)).toBe(true);
    expect(isCellAvailable(state, 0, 4)).toBe(false);
  });

  it("merges only orthogonally adjacent trays of the same color", () => {
    const initial = withSource(createInitialState(), [
      { id: "m1", drink: "matcha", count: 2 },
      { id: "m2", drink: "matcha", count: 2 },
      { id: "m3", drink: "matcha", count: 2 },
    ]);
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: "m1", col: 0, row: 0 });
    const diagonal = gameReducer(first, { type: "PLACE_TRAY", trayId: "m2", col: 1, row: 1 });
    expect(diagonal.board).toHaveLength(2);

    const merged = gameReducer(diagonal, { type: "PLACE_TRAY", trayId: "m3", col: 1, row: 0 });
    expect(merged.board).toHaveLength(0);
    expect(merged.sold).toBe(1);
    expect(merged.coins).toBe(560);
  });

  it("does not merge adjacent trays of different colors", () => {
    const initial = withSource(createInitialState(), [
      { id: "m", drink: "matcha", count: 2 },
      { id: "c", drink: "cocoa", count: 2 },
    ]);
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: "m", col: 0, row: 0 });
    const second = gameReducer(first, { type: "PLACE_TRAY", trayId: "c", col: 1, row: 0 });
    expect(second.board).toHaveLength(2);
    expect(second.board.map((tray) => tray.count)).toEqual([2, 2]);
  });

  it("rejects occupied cells without consuming the source tray", () => {
    const initial = createInitialState();
    const firstId = initial.source[0].id;
    const secondId = initial.source[1].id;
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: firstId, col: 1, row: 0 });
    const rejected = gameReducer(first, { type: "PLACE_TRAY", trayId: secondId, col: 1, row: 0 });
    expect(rejected.board).toHaveLength(1);
    expect(rejected.source.some((tray) => tray.id === secondId)).toBe(true);
  });
});
