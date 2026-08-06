import { CUSTOMER_ORDERS, createLevel } from "./levels";
import { STAGING_CAPACITY, TRAY_CAPACITY } from "./config";
import type { DrinkType, GameAction, GameState, Tray } from "./types";

const customerCursor = (state: GameState) => Math.max(0, Math.floor((state.progress - 16) / 2));

export const isTrayExposed = (tray: Tray, board: Tray[]) =>
  tray.blockedBy.every((blockerId) => !board.some((candidate) => candidate.id === blockerId));

const stagingFromDrinks = (drinks: DrinkType[]): Tray[] => {
  const grouped = (["matcha", "cocoa", "vanilla"] as DrinkType[]).flatMap((type) =>
    drinks.filter((drink) => drink === type),
  );

  return Array.from({ length: Math.ceil(grouped.length / TRAY_CAPACITY) }, (_, index) => ({
    id: `staging-${index}`,
    drinks: grouped.slice(index * TRAY_CAPACITY, index * TRAY_CAPACITY + TRAY_CAPACITY),
    x: index,
    y: 0,
    z: 1,
    blockedBy: [],
  }));
};

const consolidate = (drinks: DrinkType[]) => {
  const remaining: DrinkType[] = [];
  const completed: DrinkType[] = [];

  (["matcha", "cocoa", "vanilla"] as DrinkType[]).forEach((type) => {
    const count = drinks.filter((drink) => drink === type).length;
    const completedCount = Math.floor(count / TRAY_CAPACITY);
    for (let index = 0; index < completedCount; index += 1) completed.push(type);
    for (let index = 0; index < count % TRAY_CAPACITY; index += 1) remaining.push(type);
  });

  return { remaining, completed };
};

const resolveOrders = (state: GameState, completed: DrinkType[]) => {
  let orderOffset = customerCursor(state);
  let matched = 0;
  const unmatched = [...completed];

  while (unmatched.length > 0) {
    const expected = CUSTOMER_ORDERS[orderOffset % CUSTOMER_ORDERS.length].drink;
    const index = unmatched.indexOf(expected);
    if (index < 0) break;
    unmatched.splice(index, 1);
    matched += 1;
    orderOffset += 1;
  }

  return { matched, completedCount: completed.length };
};

export const createInitialState = (): GameState => ({
  phase: "playing",
  level: 3,
  coins: 550,
  progress: 16,
  board: createLevel(),
  staging: [],
  orders: CUSTOMER_ORDERS.slice(0, 2),
  message: "选择露出的托盘开始整理",
  combo: 0,
  reward: null,
  tools: { reshuffle: 1, removeOne: 1, clearRow: 1 },
});

const withUpdatedOrders = (state: GameState): GameState => {
  const cursor = customerCursor(state);
  return {
    ...state,
    orders: [
      CUSTOMER_ORDERS[cursor % CUSTOMER_ORDERS.length],
      CUSTOMER_ORDERS[(cursor + 1) % CUSTOMER_ORDERS.length],
    ],
  };
};

const selectTray = (state: GameState, trayId: string): GameState => {
  const selected = state.board.find((tray) => tray.id === trayId);
  if (!selected || !isTrayExposed(selected, state.board)) {
    return { ...state, message: "这个托盘还被压着呢" };
  }

  const allDrinks = [...state.staging.flatMap((tray) => tray.drinks), ...selected.drinks];
  const { remaining, completed } = consolidate(allDrinks);
  const staging = stagingFromDrinks(remaining);
  const board = state.board.filter((tray) => tray.id !== trayId);

  if (staging.length > STAGING_CAPACITY) {
    return {
      ...state,
      board,
      staging: staging.slice(0, STAGING_CAPACITY),
      phase: "lost",
      message: "备餐台放满啦！",
    };
  }

  const { matched, completedCount } = resolveOrders(state, completed);
  const completedType = completed[0];
  const progress = Math.min(100, state.progress + matched * 2 + Math.max(0, completedCount - matched));
  const coins = state.coins + matched * 10 + Math.max(0, completedCount - matched) * 5;
  const cleared = board.length === 0 && staging.length === 0;
  const stranded = board.length === 0 && staging.length > 0;

  return withUpdatedOrders({
    ...state,
    board,
    staging,
    progress,
    coins,
    phase: cleared ? "won" : stranded ? "lost" : "playing",
    message: completedCount > 0 ? (matched > 0 ? "Good! 顾客的饮品完成啦" : "完美整理一盘") : "同类饮品已自动归并",
    combo: completedCount > 0 ? state.combo + completedCount : 0,
    reward: completedType
      ? { id: Date.now(), type: completedType, coins: matched > 0 ? 10 : 5 }
      : null,
  });
};

const reshuffle = (state: GameState): GameState => {
  if (state.tools.reshuffle <= 0 || state.phase !== "playing") return state;
  const reversedDrinks = state.board.flatMap((tray) => tray.drinks).reverse();
  let cursor = 0;
  const board = state.board.map((tray) => {
    const drinks = reversedDrinks.slice(cursor, cursor + tray.drinks.length);
    cursor += tray.drinks.length;
    return { ...tray, drinks };
  });
  return {
    ...state,
    board,
    message: "所有饮品重新发放啦",
    tools: { ...state.tools, reshuffle: state.tools.reshuffle - 1 },
  };
};

const removeOne = (state: GameState): GameState => {
  if (state.tools.removeOne <= 0 || state.phase !== "playing") return state;
  const target = [...state.board]
    .filter((tray) => isTrayExposed(tray, state.board))
    .sort((a, b) => b.z - a.z)[0];
  if (!target) return state;
  return {
    ...state,
    board: state.board.filter((tray) => tray.id !== target.id),
    message: "移走了一个挡路托盘",
    tools: { ...state.tools, removeOne: state.tools.removeOne - 1 },
  };
};

const clearRow = (state: GameState): GameState => {
  if (state.tools.clearRow <= 0 || state.phase !== "playing") return state;
  const exposed = state.board.filter((tray) => isTrayExposed(tray, state.board));
  const targetIds = new Set(exposed.slice(0, 2).map((tray) => tray.id));
  if (targetIds.size === 0) return state;
  return {
    ...state,
    board: state.board.filter((tray) => !targetIds.has(tray.id)),
    message: "清出了一排空间",
    tools: { ...state.tools, clearRow: state.tools.clearRow - 1 },
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SELECT_TRAY":
      return state.phase === "playing" ? selectTray(state, action.trayId) : state;
    case "RESHUFFLE":
      return reshuffle(state);
    case "REMOVE_ONE":
      return removeOne(state);
    case "CLEAR_ROW":
      return clearRow(state);
    case "DISMISS_REWARD":
      return { ...state, reward: null };
    case "RESTART":
      return createInitialState();
    default:
      return state;
  }
};

