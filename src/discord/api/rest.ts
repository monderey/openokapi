import axios from "axios";
import { DISCORD_API_BASE } from "../types.js";
import type { DiscordCommandData } from "../commands/command.js";

export async function discordRequest<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${DISCORD_API_BASE}${path}`,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      data: body,
    });

    return response.data as T;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Discord API error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
      );
    }
    throw error;
  }
}

export async function registerSlashCommands(
  token: string,
  commandData: DiscordCommandData[],
): Promise<void> {
  const app = await discordRequest<{ id: string }>(
    "GET",
    "/oauth2/applications/@me",
    token,
  );
  await discordRequest(
    "PUT",
    `/applications/${app.id}/commands`,
    token,
    commandData,
  );
}
