export type DrinkType =
  | "matcha"
  | "cocoa"
  | "vanilla"
  | "taro"
  | "strawberry"
  | "blueberry";

export type GamePhase = "playing" | "won" | "lost";

export type DemoLevelId = "pure" | "mixed";

export interface Tray {
  id: string;
  drinks: DrinkType[];
  col: number;
  row: number;
}

export interface SourceTray {
  id: string;
  drinks: DrinkType[];
}

export interface CupTransfer {
  key: string;
  drink: DrinkType;
  sourceTrayId: string;
  destinationTrayId: string;
  sourceCol: number;
  sourceRow: number;
  destinationCol: number;
  destinationRow: number;
  sourceSlotIndex: number;
  destinationSlotIndex: number;
  sequence: number;
}

export interface MergeAnimation {
  id: number;
  trays: Tray[];
  transfers: CupTransfer[];
  soldTrayIds: string[];
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
  demoLevelId: DemoLevelId;
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
  | { type: "SELECT_LEVEL"; levelId: DemoLevelId }
  | { type: "SELECT_SOURCE"; trayId: string }
  | { type: "PLACE_TRAY"; trayId: string; col: number; row: number }
  | { type: "RESHUFFLE" }
  | { type: "REMOVE_ONE" }
  | { type: "CLEAR_ROW" }
  | { type: "DISMISS_REWARD" }
  | { type: "RESTART" };
