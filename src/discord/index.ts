import fs from "node:fs";
import type WebSocket from "ws";
import { commands } from "./commands/index.js";
import { connectGateway, updatePresence } from "./api/gateway.js";
import { registerSlashCommands } from "./api/rest.js";
import {
  createUserTag,
  getOptionString,
  isAdmin,
  deferReply,
  editInteractionReply,
  followUpInteraction,
} from "./api/interactions.js";
import {
  loadDiscordConfig,
  updateDiscordConfig,
  type DiscordConfig,
} from "../config/discord.js";
import { getDiscordPidPath, getDiscordLogPath } from "../config/paths.js";

let activeSocket: WebSocket | null = null;

function writeLog(
  message: string,
  level: "log" | "error" | "warn" = "log",
): void {
  const config = loadDiscordConfig();
  if (!config.headless) return;

  const logPath = getDiscordLogPath();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  try {
    fs.appendFileSync(logPath, logEntry, "utf-8");
  } catch {
    // ignore
  }
}

function buildContext(socket: WebSocket) {
  return {
    getConfig: () => loadDiscordConfig(),
    updateConfig: (partial: DiscordConfig) => updateDiscordConfig(partial),
    setPresenceText: async (text: string | null) =>
      updatePresence(socket, text),
    requestRestart: () => {
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    },
  };
}

function writePidFile(): void {
  const pidPath = getDiscordPidPath();
  fs.writeFileSync(pidPath, String(process.pid), "utf-8");
  process.on("exit", () => {
    try {
      fs.rmSync(pidPath, { force: true });
      const config = loadDiscordConfig();
      if (config.headless) {
        const logPath = getDiscordLogPath();
        fs.rmSync(logPath, { force: true });
      }
    } catch {
      // noop
    }
  });
}

function setupLogging(): void {
  const config = loadDiscordConfig();
  if (!config.headless) return;

  const logPath = getDiscordLogPath();

  try {
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, "", "utf-8");
    }
  } catch {
    // ignore
  }

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(" ");
    writeLog(message, "log");
    originalLog(...args);
  };

  console.error = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(" ");
    writeLog(message, "error");
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(" ");
    writeLog(message, "warn");
    originalWarn(...args);
  };
}

function buildInfoEmbed(title: string, description: string, color: number) {
  return {
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
  };
}

export async function startDiscordBot(token: string): Promise<void> {
  if (activeSocket) {
    return;
  }

  writePidFile();
  setupLogging();
  await registerSlashCommands(
    token,
    commands.map((command) => command.data),
  );

  activeSocket = await connectGateway(token, {
    onReady: (ready) => {
      const tag =
        ready.user.discriminator && ready.user.discriminator !== "0"
          ? `${ready.user.username}#${ready.user.discriminator}`
          : ready.user.username;
      const config = loadDiscordConfig();
      updatePresence(activeSocket as WebSocket, config.presenceText);
    },
    onInteraction: async (interaction) => {
      const command = commands.find(
        (item) => item.data.name === interaction.data.name,
      );
      if (!command) {
        return;
      }

      const config = loadDiscordConfig();
      const commandName = interaction.data.name;

      try {
        await deferReply(interaction, token);
      } catch (error) {
        console.error("Failed to defer interaction:", error);
        return;
      }

      if (
        !config.usageEnabled &&
        commandName !== "usage" &&
        commandName !== "restart"
      ) {
        await editInteractionReply(interaction, token, {
          embeds: [
            buildInfoEmbed(
              "Commands Disabled",
              "Currently, commands are disabled. Available: /usage, /restart.",
              0xef4444,
            ),
          ],
        });
        return;
      }

      if (command.adminOnly && !isAdmin(interaction)) {
        await editInteractionReply(interaction, token, {
          embeds: [
            buildInfoEmbed(
              "Insufficient Permissions",
              "This command requires administrator permissions.",
              0xf59e0b,
            ),
          ],
        });
        return;
      }

      const userTag = createUserTag(interaction);

      try {
        await command.execute(
          {
            commandName,
            userTag,
            isAdmin: isAdmin(interaction),
            options: {
              getString: (name, required) =>
                getOptionString(interaction, name, required),
            },
            reply: (payload) =>
              editInteractionReply(
                interaction,
                token,
                payload as { content?: string; embeds?: unknown[] },
              ),
            editReply: (payload) =>
              editInteractionReply(
                interaction,
                token,
                payload as { content?: string; embeds?: unknown[] },
              ),
            followUp: (payload) =>
              followUpInteraction(interaction, token, payload),
          },
          buildContext(activeSocket as WebSocket),
        );
      } catch (error) {
        console.error("Command Error:", error);
        try {
          await editInteractionReply(interaction, token, {
            content: "An error occurred while executing the command.",
          });
        } catch {
          // ignore
        }
      }
    },
    onClose: () => {
      console.log("Connection to gateway has been closed.");
      process.exit(0);
    },
    onError: (error) => {
      console.error("Gateway Error:", error);
    },
  });
}

export async function startDiscordBotFromConfig(): Promise<void> {
  const config = loadDiscordConfig();
  if (!config.enabled) {
    console.log("Discord bot is disabled (status off).");
    return;
  }

  if (!config.token) {
    throw new Error(
      'Missing bot token. Use: openokapi agent discord --settoken "TOKEN".',
    );
  }

  await startDiscordBot(config.token);
}
