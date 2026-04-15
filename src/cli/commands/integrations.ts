import chalk from "chalk";
import {
  deleteIntegration,
  listIntegrations,
  upsertIntegration,
  type IntegrationType,
} from "../../config/integrations.js";
import {
  clearIntegrationDeadLetters,
  deleteIntegrationDeadLetter,
  dispatchIntegrationEvent,
  listIntegrationDeadLetters,
  retryIntegrationDeadLetter,
} from "../../functions/integrations-dispatch.js";
import { line, width } from "../../utils/cliTypes.js";

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function parseType(value: string | undefined): IntegrationType | undefined {
  return value === "webhook" ||
    value === "slack" ||
    value === "telegram" ||
    value === "discord" ||
    value === "github" ||
    value === "gitlab" ||
    value === "jira" ||
    value === "linear" ||
    value === "notion" ||
    value === "teams" ||
    value === "pagerduty"
    ? value
    : undefined;
}

export async function runIntegrations(commandArgs: string[]): Promise<void> {
  if (commandArgs.includes("--set")) {
    const id = getFlagValue(commandArgs, "--id");
    const type = parseType(getFlagValue(commandArgs, "--type"));
    if (!id || !type) {
      throw new Error("Use --set --id <id> --type <integration-type>");
    }

    const eventsRaw = getFlagValue(commandArgs, "--events");
    const input: {
      id: string;
      type: IntegrationType;
      endpoint?: string;
      token?: string;
      secret?: string;
      headers?: Record<string, string>;
      channel?: string;
      enabled?: boolean;
      events?: string[];
      timeoutMs?: number;
      retries?: number;
      retryBackoffMs?: number;
      maxPayloadBytes?: number;
      deadLetterEnabled?: boolean;
    } = {
      id,
      type,
      enabled: getFlagValue(commandArgs, "--enabled") !== "false",
    };

    const endpoint = getFlagValue(commandArgs, "--endpoint");
    const token = getFlagValue(commandArgs, "--token");
    const secret = getFlagValue(commandArgs, "--secret");
    const channel = getFlagValue(commandArgs, "--channel");
    const headersJson = getFlagValue(commandArgs, "--headers");
    const timeoutMsRaw = getFlagValue(commandArgs, "--timeout-ms");
    const retriesRaw = getFlagValue(commandArgs, "--retries");
    const retryBackoffMsRaw = getFlagValue(commandArgs, "--retry-backoff-ms");
    const maxPayloadBytesRaw = getFlagValue(commandArgs, "--max-payload-bytes");
    const deadLetterEnabledRaw = getFlagValue(commandArgs, "--dead-letter");
    if (endpoint) input.endpoint = endpoint;
    if (token) input.token = token;
    if (secret) input.secret = secret;
    if (channel) input.channel = channel;
    if (eventsRaw) input.events = eventsRaw.split(",").map((it) => it.trim());

    if (headersJson) {
      const parsed = JSON.parse(headersJson) as Record<string, unknown>;
      input.headers = Object.fromEntries(
        Object.entries(parsed)
          .filter(
            ([key, value]) =>
              typeof key === "string" && typeof value === "string",
          )
          .map(([key, value]) => [key, String(value)]),
      );
    }

    if (timeoutMsRaw) {
      const timeoutMs = Number.parseInt(timeoutMsRaw, 10);
      if (Number.isFinite(timeoutMs)) input.timeoutMs = timeoutMs;
    }
    if (retriesRaw) {
      const retries = Number.parseInt(retriesRaw, 10);
      if (Number.isFinite(retries)) input.retries = retries;
    }
    if (retryBackoffMsRaw) {
      const retryBackoffMs = Number.parseInt(retryBackoffMsRaw, 10);
      if (Number.isFinite(retryBackoffMs))
        input.retryBackoffMs = retryBackoffMs;
    }
    if (maxPayloadBytesRaw) {
      const maxPayloadBytes = Number.parseInt(maxPayloadBytesRaw, 10);
      if (Number.isFinite(maxPayloadBytes))
        input.maxPayloadBytes = maxPayloadBytes;
    }
    if (deadLetterEnabledRaw === "true" || deadLetterEnabledRaw === "false") {
      input.deadLetterEnabled = deadLetterEnabledRaw === "true";
    }

    upsertIntegration(input);
  }

  if (commandArgs.includes("--delete")) {
    const id = getFlagValue(commandArgs, "--id");
    if (!id) throw new Error("Use --delete --id <id>");
    deleteIntegration(id);
  }

  if (commandArgs.includes("--dispatch")) {
    const event = getFlagValue(commandArgs, "--event") || "manual.dispatch";
    const payloadText = getFlagValue(commandArgs, "--payload") || "{}";
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      payload = { raw: payloadText };
    }

    const results = await dispatchIntegrationEvent({ event, payload });
    console.log(results);
  }

  if (commandArgs.includes("--dlq")) {
    const retryId = getFlagValue(commandArgs, "--retry-id");
    const deleteId = getFlagValue(commandArgs, "--delete-id");

    if (commandArgs.includes("--clear")) {
      clearIntegrationDeadLetters();
      console.log(chalk.green("Integration DLQ cleared."));
    } else if (retryId) {
      const result = await retryIntegrationDeadLetter(retryId);
      if (!result.found) {
        throw new Error("DLQ entry not found");
      }
      console.log(result);
    } else if (deleteId) {
      const ok = deleteIntegrationDeadLetter(deleteId);
      if (!ok) {
        throw new Error("DLQ entry not found");
      }
      console.log(chalk.green("DLQ entry deleted."));
    } else {
      const entries = listIntegrationDeadLetters(100);
      console.log(entries);
    }
  }

  const items = listIntegrations();
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Integrations"));
  console.log(chalk.dim("│"));
  console.log(line(""));
  console.log(line(`  Count: ${chalk.cyan(String(items.length))}`));
  console.log(line(""));
  for (const item of items) {
    console.log(
      line(
        `  ${item.enabled ? chalk.green("✓") : chalk.red("✗")} ${item.id} (${item.type}) events:${item.events.length} retries:${item.retries} timeout:${item.timeoutMs}ms dlq:${item.deadLetterEnabled ? "on" : "off"}`,
      ),
    );
  }
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
