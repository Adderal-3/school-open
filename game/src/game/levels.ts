import type { CustomerOrder, DrinkType, Tray } from "./types";

type TraySeed = Omit<Tray, "drinks"> & { drinks: DrinkType[] };

const tray = (
  id: string,
  drinks: DrinkType[],
  x: number,
  y: number,
  z: number,
  blockedBy: string[] = [],
): TraySeed => ({ id, drinks, x, y, z, blockedBy });

export const LEVEL_THREE: Tray[] = [
  tray("tray-a", ["matcha", "matcha", "cocoa", "cocoa"], 5, 8, 1, ["tray-f"]),
  tray("tray-b", ["matcha", "cocoa", "cocoa", "vanilla"], 39, 7, 1, ["tray-g"]),
  tray("tray-c", ["matcha", "matcha", "matcha", "vanilla"], 72, 9, 1, ["tray-h"]),
  tray("tray-d", ["cocoa", "cocoa", "vanilla", "vanilla"], 8, 48, 2, ["tray-i"]),
  tray("tray-e", ["vanilla", "vanilla", "matcha", "matcha"], 68, 50, 2, ["tray-i"]),
  tray("tray-f", ["matcha", "matcha", "cocoa", "cocoa"], 12, 25, 3),
  tray("tray-g", ["matcha", "matcha", "cocoa", "cocoa"], 42, 28, 3),
  tray("tray-h", ["cocoa", "cocoa", "vanilla", "vanilla"], 69, 28, 3),
  tray("tray-i", ["vanilla", "vanilla", "vanilla", "vanilla"], 37, 56, 4),
];

export const CUSTOMER_ORDERS: CustomerOrder[] = [
  { id: "order-1", avatar: "👵", drink: "matcha" },
  { id: "order-2", avatar: "🐱", drink: "cocoa" },
  { id: "order-3", avatar: "🦁", drink: "vanilla" },
  { id: "order-4", avatar: "🐰", drink: "matcha" },
  { id: "order-5", avatar: "🐻", drink: "cocoa" },
  { id: "order-6", avatar: "🦊", drink: "vanilla" },
];

export const createLevel = (): Tray[] =>
  LEVEL_THREE.map((item) => ({ ...item, drinks: [...item.drinks], blockedBy: [...item.blockedBy] }));

