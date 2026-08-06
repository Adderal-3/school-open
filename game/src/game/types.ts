export type DrinkType = "matcha" | "cocoa" | "vanilla";

export type GamePhase = "playing" | "won" | "lost";

export interface Tray {
  id: string;
  drinks: DrinkType[];
  x: number;
  y: number;
  z: number;
  blockedBy: string[];
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
  staging: Tray[];
  orders: CustomerOrder[];
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
  | { type: "SELECT_TRAY"; trayId: string }
  | { type: "RESHUFFLE" }
  | { type: "REMOVE_ONE" }
  | { type: "CLEAR_ROW" }
  | { type: "DISMISS_REWARD" }
  | { type: "RESTART" };

