import type { DrinkType } from "./types";

export const DRINKS: Record<
  DrinkType,
  { emoji: string; shortName: string; name: string; color: string; cup: string }
> = {
  matcha: {
    emoji: "🍵",
    shortName: "抹茶",
    name: "云顶抹茶",
    color: "#78b83d",
    cup: "#66b83f",
  },
  cocoa: {
    emoji: "🥤",
    shortName: "可可",
    name: "醇香可可",
    color: "#75421f",
    cup: "#793b9d",
  },
  vanilla: {
    emoji: "🧁",
    shortName: "香草",
    name: "香草奶霜",
    color: "#f0d1a8",
    cup: "#6b3f2a",
  },
};

export const STAGING_CAPACITY = 3;
export const TRAY_CAPACITY = 6;

