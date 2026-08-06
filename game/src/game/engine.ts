import { DRINK_TYPES, LEVEL_SALES_TARGET, SOURCE_CAPACITY, TRAY_CAPACITY } from "./config";
import { CUSTOMER_ORDERS, DEMO_LEVELS, createSourceQueue } from "./levels";
import type { CupTransfer, DemoLevelId, DrinkType, GameAction, GameState, MergeAnimation, SourceTray, Tray } from "./types";

const isSameCell = (a: { col: number; row: number }, b: { col: number; row: number }) =>
  a.col === b.col && a.row === b.row;

const isAdjacent = (a: Tray, b: Tray) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
const countDrink = (tray: Tray, drink: DrinkType) => tray.drinks.filter((item) => item === drink).length;
const cloneTray = (tray: Tray): Tray => ({ ...tray, drinks: [...tray.drinks] });

export const isCellAvailable = (state: GameState, col: number, row: number) =>
  col >= 0 && col < 4 && row >= 0 && row < 5 &&
  !(row === 4 && (col === 0 || col === 3)) &&
  !state.board.some((item) => isSameCell(item, { col, row }));

const refillSource = (source: SourceTray[], reserve: SourceTray[]) => {
  const nextSource = [...source];
  const nextReserve = [...reserve];
  while (nextSource.length < SOURCE_CAPACITY && nextReserve.length > 0) {
    nextSource.push(nextReserve.shift()!);
  }
  return { source: nextSource, reserve: nextReserve };
};

const resolveTerminalState = (state: GameState): GameState => {
  if (state.source.length > 0 || state.reserve.length > 0) return state;
  const won = state.sold >= LEVEL_SALES_TARGET;
  return {
    ...state,
    phase: won ? "won" : "lost",
    message: won
      ? "本关全部订单已完成"
      : `待放托盘已经用完，本关完成 ${state.sold}/${LEVEL_SALES_TARGET} 份订单`,
  };
};

export const getConnectedByColor = (board: Tray[], startId: string, drink: DrinkType) => {
  const start = board.find((tray) => tray.id === startId && tray.drinks.includes(drink));
  if (!start) return [];
  const connected: Tray[] = [];
  const pending = [start];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const current = pending.shift()!;
    if (seen.has(current.id)) continue;
    seen.add(current.id);
    connected.push(current);
    board.forEach((candidate) => {
      if (!seen.has(candidate.id) && candidate.drinks.includes(drink) && isAdjacent(current, candidate)) {
        pending.push(candidate);
      }
    });
  }
  return connected;
};

export const getConnectedSameType = (board: Tray[], startId: string) => {
  const start = board.find((tray) => tray.id === startId);
  const drink = start?.drinks[0];
  return drink ? getConnectedByColor(board, startId, drink) : [];
};

export const selectMergeDestination = (connected: Tray[], placedId: string, drink = connected.find((tray) => tray.id === placedId)?.drinks[0]) => {
  const placed = connected.find((tray) => tray.id === placedId);
  if (!placed || !drink) return connected[0];
  return connected.reduce(
    (destination, candidate) => countDrink(candidate, drink) > countDrink(destination, drink) ? candidate : destination,
    placed,
  );
};

export const createInitialState = (levelId: DemoLevelId = "pure"): GameState => {
  const level = DEMO_LEVELS[levelId];
  const queue = createSourceQueue(levelId);
  return {
    phase: "playing",
    demoLevelId: levelId,
    level: level.number,
    coins: 550,
    progress: 16,
    board: [],
    source: queue.slice(0, SOURCE_CAPACITY),
    reserve: queue.slice(SOURCE_CAPACITY),
    selectedSourceId: null,
    orders: CUSTOMER_ORDERS.slice(0, 2),
    nextOrderIndex: 2,
    sold: 0,
    message: level.shortDescription,
    combo: 0,
    reward: null,
    tools: { reshuffle: 1, removeOne: 1, clearRow: 1 },
  };
};

export interface PlacementPlan {
  state: GameState;
  animation: MergeAnimation | null;
}

export const planPlacement = (state: GameState, trayId: string, col: number, row: number): PlacementPlan => {
  const incoming = state.source.find((tray) => tray.id === trayId);
  if (!incoming) return { state, animation: null };
  if (!isCellAvailable(state, col, row)) {
    return { state: { ...state, message: "这个格子不能放，请换一个空格试试" }, animation: null };
  }

  const placed: Tray = { ...incoming, drinks: [...incoming.drinks], col, row };
  let board = [...state.board.map(cloneTray), placed];
  const beforeTrays = board.map(cloneTray);
  const originalSlots = new Map<string, Map<DrinkType, number[]>>();
  beforeTrays.forEach((tray) => {
    const byDrink = new Map<DrinkType, number[]>();
    tray.drinks.forEach((drink, index) => byDrink.set(drink, [...(byDrink.get(drink) ?? []), index]));
    originalSlots.set(tray.id, byDrink);
  });

  const transfers: CupTransfer[] = [];
  const placedColors = DRINK_TYPES.filter((drink) => placed.drinks.includes(drink));
  placedColors.forEach((drink) => {
    const connected = getConnectedByColor(board, placed.id, drink);
    if (connected.length < 2) return;
    const destination = selectMergeDestination(connected, placed.id, drink);
    const sources = connected.filter((tray) => tray.id !== destination.id);
    sources.forEach((source) => {
      while (source.drinks.includes(drink) && destination.drinks.length < TRAY_CAPACITY) {
        const sourceIndex = source.drinks.indexOf(drink);
        const sourceSlotIndex = originalSlots.get(source.id)?.get(drink)?.shift() ?? sourceIndex;
        const destinationSlotIndex = destination.drinks.length;
        source.drinks.splice(sourceIndex, 1);
        destination.drinks.push(drink);
        transfers.push({
          key: `${trayId}-${transfers.length}-${source.id}-${drink}`,
          drink,
          sourceTrayId: source.id,
          destinationTrayId: destination.id,
          sourceCol: source.col,
          sourceRow: source.row,
          destinationCol: destination.col,
          destinationRow: destination.row,
          sourceSlotIndex,
          destinationSlotIndex,
          sequence: transfers.length,
        });
      }
    });
    board = board.filter((tray) => tray.drinks.length > 0);
  });

  let orders = [...state.orders];
  let nextOrderIndex = state.nextOrderIndex;
  const soldTrayIds: string[] = [];
  const soldTypes: DrinkType[] = [];
  board.forEach((tray) => {
    const drink = tray.drinks[0];
    const uniform = tray.drinks.length === TRAY_CAPACITY && tray.drinks.every((item) => item === drink);
    const orderIndex = uniform ? orders.findIndex((order) => order.drink === drink) : -1;
    if (orderIndex < 0) return;
    soldTrayIds.push(tray.id);
    soldTypes.push(drink);
    orders.splice(orderIndex, 1);
    const nextOrder = CUSTOMER_ORDERS[nextOrderIndex % CUSTOMER_ORDERS.length];
    orders.push({ ...nextOrder, id: `${nextOrder.id}-${nextOrderIndex}` });
    nextOrderIndex += 1;
  });
  board = board.filter((tray) => !soldTrayIds.includes(tray.id));

  const remainingSource = state.source.filter((tray) => tray.id !== trayId);
  const refilled = refillSource(remainingSource, state.reserve);
  const soldCount = soldTypes.length;
  const nextState = resolveTerminalState({
    ...state,
    board,
    source: refilled.source,
    reserve: refilled.reserve,
    selectedSourceId: null,
    orders,
    nextOrderIndex,
    sold: state.sold + soldCount,
    phase: "playing",
    coins: state.coins + soldCount * 10,
    progress: Math.min(100, state.progress + soldCount * 4),
    combo: soldCount > 0 ? state.combo + soldCount : transfers.length > 0 ? state.combo : 0,
    reward: soldCount > 0 ? { id: Date.now(), type: soldTypes[soldTypes.length - 1], coins: soldCount * 10 } : null,
    message: soldCount > 0
      ? `订单完成：${soldCount} 盘奶茶已交给顾客`
      : transfers.length > 0
        ? `${transfers.length} 杯同色奶茶已分别归类`
        : `已放入棋盘：${incoming.drinks.length}/${TRAY_CAPACITY}`,
  });

  return {
    state: nextState,
    animation: transfers.length > 0 ? {
      id: Date.now(),
      trays: beforeTrays,
      transfers,
      soldTrayIds,
    } : null,
  };
};

const reshuffle = (state: GameState): GameState => {
  if (state.tools.reshuffle <= 0 || state.phase !== "playing") return state;
  return { ...state, source: [...state.source].reverse(), selectedSourceId: null, message: "下方待放托盘已重新发放", tools: { ...state.tools, reshuffle: 0 } };
};

const removeOne = (state: GameState): GameState => {
  if (state.tools.removeOne <= 0 || state.phase !== "playing" || state.board.length === 0) return state;
  return resolveTerminalState({
    ...state,
    board: state.board.slice(0, -1),
    message: "已移除棋盘上的一个托盘",
    tools: { ...state.tools, removeOne: 0 },
  });
};

const clearRow = (state: GameState): GameState => {
  if (state.tools.clearRow <= 0 || state.phase !== "playing" || state.board.length === 0) return state;
  const row = state.board[state.board.length - 1].row;
  return resolveTerminalState({
    ...state,
    board: state.board.filter((tray) => tray.row !== row),
    message: "已清除棋盘上的一排托盘",
    tools: { ...state.tools, clearRow: 0 },
  });
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SELECT_LEVEL": return createInitialState(action.levelId);
    case "SELECT_SOURCE":
      return state.phase === "playing"
        ? state.selectedSourceId === action.trayId
          ? { ...state, selectedSourceId: null, message: "把下方奶茶托盘拖到棋盘空格" }
          : { ...state, selectedSourceId: action.trayId, message: "已选中托盘，请点击一个高亮的棋盘空格" }
        : state;
    case "PLACE_TRAY": return state.phase === "playing" ? planPlacement(state, action.trayId, action.col, action.row).state : state;
    case "RESHUFFLE": return reshuffle(state);
    case "REMOVE_ONE": return removeOne(state);
    case "CLEAR_ROW": return clearRow(state);
    case "DISMISS_REWARD": return { ...state, reward: null };
    case "RESTART": return createInitialState(state.demoLevelId);
    default: return state;
  }
};
