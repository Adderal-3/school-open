import { DRINK_TYPES } from "./config";
import type { CustomerOrder, SourceTray } from "./types";

const avatars = ["👵", "🐱", "🐶", "🐼", "🐰", "🦊"];

export const CUSTOMER_ORDERS: CustomerOrder[] = DRINK_TYPES.map((drink, index) => ({
  id: `order-${index + 1}`,
  avatar: avatars[index],
  drink,
}));

export const createSourceQueue = (): SourceTray[] => {
  const queue: SourceTray[] = [];
  for (let group = 0; group < 2; group += 1) {
    const types = DRINK_TYPES.slice(group * 3, group * 3 + 3);
    for (let round = 0; round < 3; round += 1) {
      types.forEach((drink) => {
        queue.push({ id: `source-${drink}-${round + 1}`, drink, count: 2 });
      });
    }
  }
  return queue;
};
