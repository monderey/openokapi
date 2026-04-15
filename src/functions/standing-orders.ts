import { listStandingOrders } from "../config/standing-orders.js";

export function buildStandingOrdersPrompt(input: {
  provider: "openai" | "claude" | "ollama";
}): string {
  const orders = listStandingOrders().filter((order) => {
    if (!order.enabled) {
      return false;
    }
    if (order.scope === "global") {
      return true;
    }
    return order.provider === input.provider;
  });

  if (orders.length === 0) {
    return "";
  }

  const lines = orders.map(
    (order, index) => `${index + 1}. ${order.title}: ${order.content}`,
  );

  return ["Standing orders (must be followed):", ...lines, ""].join("\n");
}

export function applyStandingOrdersToPrompt(input: {
  provider: "openai" | "claude" | "ollama";
  prompt: string;
}): string {
  const standing = buildStandingOrdersPrompt({ provider: input.provider });
  if (!standing) {
    return input.prompt;
  }

  return `${standing}User request:\n${input.prompt}`;
}
