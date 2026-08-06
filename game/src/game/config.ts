import type { DrinkType } from "./types";

export const DRINK_TYPES: DrinkType[] = [
  "matcha",
  "cocoa",
  "vanilla",
  "taro",
  "strawberry",
  "blueberry",
];

export const DRINKS: Record<
  DrinkType,
  { emoji: string; shortName: string; name: string; color: string; cup: string }
> = {
  matcha: { emoji: "🍵", shortName: "抹茶", name: "云顶抹茶", color: "#78b83d", cup: "#58b33e" },
  cocoa: { emoji: "🧋", shortName: "可可", name: "醇香可可", color: "#75421f", cup: "#74369b" },
  vanilla: { emoji: "🥛", shortName: "香草", name: "香草奶霜", color: "#f0d1a8", cup: "#714632" },
  taro: { emoji: "🟣", shortName: "香芋", name: "香芋奶茶", color: "#9a66d4", cup: "#9160ca" },
  strawberry: { emoji: "🍓", shortName: "草莓", name: "草莓奶茶", color: "#ef6d87", cup: "#e85f7d" },
  blueberry: { emoji: "🫐", shortName: "蓝莓", name: "蓝莓奶茶", color: "#6476d9", cup: "#596bd0" },
};

export const SOURCE_CAPACITY = 3;
export const TRAY_CAPACITY = 6;
export const LEVEL_SALES_TARGET = 6; // One sale for each drink type in this level.
