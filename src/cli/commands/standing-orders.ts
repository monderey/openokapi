import chalk from "chalk";
import {
  deleteStandingOrder,
  listStandingOrders,
  upsertStandingOrder,
  type StandingOrderScope,
} from "../../config/standing-orders.js";
import { buildStandingOrdersPrompt } from "../../functions/standing-orders.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

export function runStandingOrders(commandArgs: string[]): void {
  if (commandArgs.includes("--set")) {
    const id = getFlagValue(commandArgs, "--id");
    const title = getFlagValue(commandArgs, "--title") || "";
    const content = getFlagValue(commandArgs, "--content") || "";
    const scope: StandingOrderScope =
      getFlagValue(commandArgs, "--scope") === "provider"
        ? "provider"
        : "global";
    const provider = getFlagValue(commandArgs, "--provider");
    const priorityRaw = Number(getFlagValue(commandArgs, "--priority") || "");

    const payload: {
      id?: string;
      title: string;
      content: string;
      enabled?: boolean;
      priority?: number;
      scope?: StandingOrderScope;
      provider?: "openai" | "claude" | "ollama";
    } = {
      title,
      content,
      enabled: getFlagValue(commandArgs, "--enabled") !== "false",
      scope,
    };

    if (id) payload.id = id;
    if (Number.isFinite(priorityRaw))
      payload.priority = Math.floor(priorityRaw);
    if (
      provider === "openai" ||
      provider === "claude" ||
      provider === "ollama"
    ) {
      payload.provider = provider;
    }

    upsertStandingOrder(payload);
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --delete --id <standing-order-id>");
    deleteStandingOrder(id);
  }

  const preview = getFlagValue(commandArgs, "--preview");
  if (preview === "openai" || preview === "claude" || preview === "ollama") {
    console.log(buildStandingOrdersPrompt({ provider: preview }));
    return;
  }

  const orders = listStandingOrders();
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Standing Orders"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Count: ${chalk.cyan(String(orders.length))}`));
  console.log(line(""));
  for (const order of orders) {
    console.log(
      line(
        `  ${order.enabled ? chalk.green("✓") : chalk.red("✗")} ${order.id} p:${order.priority} ${order.title} scope:${order.scope}${order.provider ? `:${order.provider}` : ""}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
