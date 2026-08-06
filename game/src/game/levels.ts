import { DRINK_TYPES } from "./config";
import type { CustomerOrder, DemoLevelId, SourceTray } from "./types";

const avatars = ["👵", "🐱", "🐶", "🐼", "🐰", "🦊"];

export const CUSTOMER_ORDERS: CustomerOrder[] = DRINK_TYPES.map((drink, index) => ({
  id: `order-${index + 1}`,
  avatar: avatars[index],
  drink,
}));

export const DEMO_LEVELS: Record<DemoLevelId, {
  id: DemoLevelId;
  number: number;
  name: string;
  shortDescription: string;
}> = {
  pure: {
    id: "pure",
    number: 1,
    name: "纯色关",
    shortDescription: "相同纯色托盘相邻合并",
  },
  mixed: {
    id: "mixed",
    number: 2,
    name: "混色关",
    shortDescription: "各颜色独立迁移，未匹配留在原盘",
  },
};

const createPureSourceQueue = (): SourceTray[] => {
  const queue: SourceTray[] = [];
  for (let group = 0; group < 2; group += 1) {
    const types = DRINK_TYPES.slice(group * 3, group * 3 + 3);
    for (let round = 0; round < 3; round += 1) {
      types.forEach((drink) => {
        queue.push({ id: `source-${drink}-${round + 1}`, drinks: [drink, drink] });
      });
    }
  }
  return queue;
};

const createMixedSourceQueue = (): SourceTray[] => {
  const pairs = DRINK_TYPES.map((drink, index) => [drink, DRINK_TYPES[(index + 1) % DRINK_TYPES.length]] as const);
  return Array.from({ length: 3 }, (_, round) => (
    pairs.map(([first, second], pairIndex) => ({
      id: `source-mixed-${round + 1}-${pairIndex + 1}`,
      drinks: [first, second],
    }))
  )).flat();
};

export const createSourceQueue = (levelId: DemoLevelId = "pure"): SourceTray[] =>
  levelId === "mixed" ? createMixedSourceQueue() : createPureSourceQueue();
