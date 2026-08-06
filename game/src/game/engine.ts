import { SOURCE_CAPACITY, TRAY_CAPACITY } from "./config";
import { CUSTOMER_ORDERS, createSourceQueue } from "./levels";
import type { GameAction, GameState, SourceTray, Tray } from "./types";

const isSameCell = (a: { col: number; row: number }, b: { col: number; row: number }) =>
  a.col === b.col && a.row === b.row;

const isAdjacent = (a: Tray, b: Tray) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;

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

const getConnectedSameType = (board: Tray[], startId: string) => {
  const start = board.find((tray) => tray.id === startId);
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
      if (!seen.has(candidate.id) && candidate.drink === start.drink && isAdjacent(current, candidate)) {
        pending.push(candidate);
      }
    });
  }
  return connected;
};

export const createInitialState = (): GameState => {
  const queue = createSourceQueue();
  return {
    phase: "playing",
    level: 3,
    coins: 550,
    progress: 16,
    board: [],
    source: queue.slice(0, SOURCE_CAPACITY),
    reserve: queue.slice(SOURCE_CAPACITY),
    selectedSourceId: null,
    orders: CUSTOMER_ORDERS.slice(0, 2),
    nextOrderIndex: 2,
    sold: 0,
    message: "把下方同色奶茶托盘拖到棋盘空格",
    combo: 0,
    reward: null,
    tools: { reshuffle: 1, removeOne: 1, clearRow: 1 },
  };
};

const placeTray = (state: GameState, trayId: string, col: number, row: number): GameState => {
  const incoming = state.source.find((tray) => tray.id === trayId);
  if (!incoming) return state;
  if (!isCellAvailable(state, col, row)) {
    return { ...state, message: "这个格子不能放，换一个空格试试" };
  }

  const placed: Tray = { ...incoming, col, row };
  let board = [...state.board, placed];
  const connected = getConnectedSameType(board, placed.id);
  const connectedIds = new Set(connected.map((tray) => tray.id));
  const total = connected.reduce((sum, tray) => sum + tray.count, 0);
  const matchedOrderIndex = state.orders.findIndex((order) => order.drink === placed.drink);
  const canSell = total >= TRAY_CAPACITY && matchedOrderIndex >= 0;
  const remainder = canSell ? total - TRAY_CAPACITY : total;

  if (connected.length > 1) {
    board = board.filter((tray) => !connectedIds.has(tray.id));
    if (remainder > 0) board.push({ ...placed, count: Math.min(TRAY_CAPACITY, remainder) });
  }

  let orders = state.orders;
  let nextOrderIndex = state.nextOrderIndex;
  if (canSell) {
    board = board.filter((tray) => tray.id !== placed.id);
    orders = state.orders.filter((_, index) => index !== matchedOrderIndex);
    orders = [...orders, CUSTOMER_ORDERS[nextOrderIndex % CUSTOMER_ORDERS.length]];
    nextOrderIndex += 1;
  }

  const remainingSource = state.source.filter((tray) => tray.id !== trayId);
  const refilled = refillSource(remainingSource, state.reserve);
  const sold = state.sold + (canSell ? 1 : 0);
  const cleared = refilled.source.length === 0 && refilled.reserve.length === 0 && board.length === 0;

  return {
    ...state,
    board,
    source: refilled.source,
    reserve: refilled.reserve,
    selectedSourceId: null,
    orders,
    nextOrderIndex,
    sold,
    phase: cleared ? "won" : "playing",
    coins: state.coins + (canSell ? 10 : 0),
    progress: Math.min(100, state.progress + (canSell ? 4 : 0)),
    combo: canSell ? state.combo + 1 : connected.length > 1 ? state.combo : 0,
    reward: canSell ? { id: Date.now(), type: placed.drink, coins: 10 } : null,
    message: canSell
      ? `${CUSTOMER_ORDERS.find((order) => order.drink === placed.drink)?.drink ? "订单完成" : "售出"}：整盘已交给顾客`
      : connected.length > 1
        ? `同色奶茶已合并：${remainder}/${TRAY_CAPACITY}`
        : `已放入棋盘：${incoming.count}/${TRAY_CAPACITY}`,
  };
};

const reshuffle = (state: GameState): GameState => {
  if (state.tools.reshuffle <= 0 || state.phase !== "playing") return state;
  const source = [...state.source].reverse();
  return { ...state, source, selectedSourceId: null, message: "下方待放托盘已重新发放", tools: { ...state.tools, reshuffle: 0 } };
};

const removeOne = (state: GameState): GameState => {
  if (state.tools.removeOne <= 0 || state.phase !== "playing" || state.board.length === 0) return state;
  return {
    ...state,
    board: state.board.slice(0, -1),
    message: "已移除棋盘上的一个托盘",
    tools: { ...state.tools, removeOne: 0 },
  };
};

const clearRow = (state: GameState): GameState => {
  if (state.tools.clearRow <= 0 || state.phase !== "playing" || state.board.length === 0) return state;
  const row = state.board[state.board.length - 1].row;
  return {
    ...state,
    board: state.board.filter((tray) => tray.row !== row),
    message: "已清除棋盘上的一排托盘",
    tools: { ...state.tools, clearRow: 0 },
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SELECT_SOURCE":
      return state.phase === "playing"
        ? { ...state, selectedSourceId: action.trayId, message: "已选中托盘，请点棋盘空格或直接拖放" }
        : state;
    case "PLACE_TRAY":
      return state.phase === "playing" ? placeTray(state, action.trayId, action.col, action.row) : state;
    case "RESHUFFLE": return reshuffle(state);
    case "REMOVE_ONE": return removeOne(state);
    case "CLEAR_ROW": return clearRow(state);
    case "DISMISS_REWARD": return { ...state, reward: null };
    case "RESTART": return createInitialState();
    default: return state;
  }
};
