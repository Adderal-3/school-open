import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer, isCellAvailable, planPlacement, selectMergeDestination } from "./engine";
import type { DrinkType, GameState, SourceTray, Tray } from "./types";

const source = (id: string, drink: DrinkType, count = 2): SourceTray => ({ id, drinks: Array<DrinkType>(count).fill(drink) });
const tray = (id: string, drink: DrinkType, count: number, col: number, row: number): Tray => ({ id, drinks: Array<DrinkType>(count).fill(drink), col, row });
const withSource = (state: GameState, trays: SourceTray[]): GameState => ({ ...state, source: trays, reserve: [] });

describe("drink tray placement game", () => {
  it("starts the pure demo with a persistent empty 4x5 board and three pure-color trays", () => {
    const state = createInitialState();
    expect(state.board).toHaveLength(0);
    expect(state.source).toHaveLength(3);
    expect(state.demoLevelId).toBe("pure");
    expect(state.source.map((item) => item.drinks.length)).toEqual([2, 2, 2]);
    expect(new Set(state.source.map((item) => item.drinks[0])).size).toBe(3);
    expect(state.source.every((item) => new Set(item.drinks).size === 1)).toBe(true);
    expect(isCellAvailable(state, 1, 1)).toBe(true);
    expect(isCellAvailable(state, 0, 4)).toBe(false);
  });

  it("loads a separate mixed demo and keeps restart on the selected level", () => {
    const pure = createInitialState();
    const mixed = gameReducer(pure, { type: "SELECT_LEVEL", levelId: "mixed" });
    expect(mixed.demoLevelId).toBe("mixed");
    expect(mixed.level).toBe(2);
    expect(mixed.source).toHaveLength(3);
    expect(mixed.source.every((item) => new Set(item.drinks).size === 2)).toBe(true);
    expect(mixed.source[0].drinks).toEqual(["matcha", "cocoa"]);
    const mixedDrinks = [...mixed.source, ...mixed.reserve].flatMap((item) => item.drinks);
    expect(mixedDrinks).toHaveLength(36);
    expect([...new Set(mixedDrinks)].map((drink) => mixedDrinks.filter((item) => item === drink).length)).toEqual([6, 6, 6, 6, 6, 6]);

    const restarted = gameReducer(mixed, { type: "RESTART" });
    expect(restarted.demoLevelId).toBe("mixed");
    expect(restarted.source[0].drinks).toEqual(["matcha", "cocoa"]);
  });

  it("merges only orthogonally adjacent trays that share a color", () => {
    const initial = withSource(createInitialState(), [source("m1", "matcha"), source("m2", "matcha"), source("m3", "matcha")]);
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: "m1", col: 0, row: 0 });
    const diagonal = gameReducer(first, { type: "PLACE_TRAY", trayId: "m2", col: 1, row: 1 });
    expect(diagonal.board).toHaveLength(2);

    const merged = gameReducer(diagonal, { type: "PLACE_TRAY", trayId: "m3", col: 1, row: 0 });
    expect(merged.board).toHaveLength(0);
    expect(merged.sold).toBe(1);
    expect(merged.coins).toBe(560);
  });

  it("does not merge adjacent trays without a shared color", () => {
    const initial = withSource(createInitialState(), [source("m", "matcha"), source("c", "cocoa")]);
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: "m", col: 0, row: 0 });
    const second = gameReducer(first, { type: "PLACE_TRAY", trayId: "c", col: 1, row: 0 });
    expect(second.board).toHaveLength(2);
    expect(second.board.map((item) => item.drinks.length)).toEqual([2, 2]);
  });

  it("keeps the tray with the most cups of the matching color and only favors the new tray on ties", () => {
    const fuller = tray("fuller", "vanilla", 4, 0, 0);
    const placed = tray("placed", "vanilla", 2, 1, 0);
    expect(selectMergeDestination([placed, fuller], placed.id, "vanilla").id).toBe("fuller");
    expect(selectMergeDestination([placed, tray("tied", "vanilla", 2, 0, 0)], placed.id, "vanilla").id).toBe("placed");

    const state: GameState = {
      ...createInitialState(),
      source: [source("placed", "vanilla")],
      reserve: [source("reserve", "cocoa")],
      board: [fuller],
    };
    const merged = gameReducer(state, { type: "PLACE_TRAY", trayId: "placed", col: 1, row: 0 });
    expect(merged.board).toEqual([{ ...fuller, drinks: Array<DrinkType>(6).fill("vanilla") }]);
  });

  it("moves every shared color independently and leaves unmatched cups in place", () => {
    const state: GameState = {
      ...createInitialState(),
      board: [
        { id: "a", drinks: ["matcha", "matcha", "cocoa"], col: 0, row: 0 },
        { id: "b", drinks: ["matcha", "cocoa", "cocoa"], col: 1, row: 0 },
      ],
      source: [{ id: "mixed", drinks: ["matcha", "cocoa", "vanilla"] }],
      reserve: [source("reserve", "taro")],
    };

    const plan = planPlacement(state, "mixed", 2, 0);
    expect(plan.state.board).toEqual([
      { id: "a", drinks: ["matcha", "matcha", "matcha", "matcha"], col: 0, row: 0 },
      { id: "b", drinks: ["cocoa", "cocoa", "cocoa", "cocoa"], col: 1, row: 0 },
      { id: "mixed", drinks: ["vanilla"], col: 2, row: 0 },
    ]);
    expect(plan.animation?.transfers.map((transfer) => transfer.drink).sort()).toEqual(["cocoa", "cocoa", "matcha", "matcha"]);
  });

  it("rejects occupied cells without consuming the source tray", () => {
    const initial = createInitialState();
    const firstId = initial.source[0].id;
    const secondId = initial.source[1].id;
    const first = gameReducer(initial, { type: "PLACE_TRAY", trayId: firstId, col: 1, row: 0 });
    const rejected = gameReducer(first, { type: "PLACE_TRAY", trayId: secondId, col: 1, row: 0 });
    expect(rejected.board).toHaveLength(1);
    expect(rejected.source.some((item) => item.id === secondId)).toBe(true);
  });

  it("toggles tap selection without placing or consuming a tray", () => {
    const initial = createInitialState();
    const trayId = initial.source[0].id;
    const selected = gameReducer(initial, { type: "SELECT_SOURCE", trayId });
    const deselected = gameReducer(selected, { type: "SELECT_SOURCE", trayId });
    expect(selected.selectedSourceId).toBe(trayId);
    expect(deselected.selectedSourceId).toBeNull();
    expect(deselected.source).toEqual(initial.source);
    expect(deselected.board).toEqual(initial.board);
  });

  it("ends with a clear failure state when the trays run out before the order target", () => {
    const state: GameState = {
      ...createInitialState(),
      source: [],
      reserve: [],
      board: [tray("last", "cocoa", 2, 1, 2)],
      sold: 3,
    };
    const ended = gameReducer(state, { type: "CLEAR_ROW" });
    expect(ended.phase).toBe("lost");
    expect(ended.message).toContain("3/6");
  });

  it("only reports a win when the full order target is reached", () => {
    const state: GameState = {
      ...createInitialState(),
      source: [source("m3", "matcha")],
      reserve: [],
      board: [tray("m1", "matcha", 2, 0, 0), tray("m2", "matcha", 2, 1, 0)],
      sold: 5,
    };
    const ended = gameReducer(state, { type: "PLACE_TRAY", trayId: "m3", col: 2, row: 0 });
    expect(ended.phase).toBe("won");
    expect(ended.sold).toBe(6);
  });
});
