export type DrinkType =
  | "matcha"
  | "cocoa"
  | "vanilla"
  | "taro"
  | "strawberry"
  | "blueberry";

export type GamePhase = "playing" | "won" | "lost";

export interface Tray {
  id: string;
  drink: DrinkType;
  count: number;
  col: number;
  row: number;
}

export interface SourceTray {
  id: string;
  drink: DrinkType;
  count: number;
}

export interface CustomerOrder {
  id: string;
  avatar: string;
  drink: DrinkType;
}

export interface FloatingReward {
  id: number;
  type: DrinkType;
  coins: number;
}

export interface GameState {
  phase: GamePhase;
  level: number;
  coins: number;
  progress: number;
  board: Tray[];
  source: SourceTray[];
  reserve: SourceTray[];
  selectedSourceId: string | null;
  orders: CustomerOrder[];
  nextOrderIndex: number;
  sold: number;
  message: string;
  combo: number;
  reward: FloatingReward | null;
  tools: {
    reshuffle: number;
    removeOne: number;
    clearRow: number;
  };
}

export type GameAction =
  | { type: "SELECT_SOURCE"; trayId: string }
  | { type: "PLACE_TRAY"; trayId: string; col: number; row: number }
  | { type: "RESHUFFLE" }
  | { type: "REMOVE_ONE" }
  | { type: "CLEAR_ROW" }
  | { type: "DISMISS_REWARD" }
  | { type: "RESTART" };
