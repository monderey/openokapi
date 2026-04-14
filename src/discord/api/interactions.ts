import axios from "axios";
import type { GatewayInteraction } from "./types.js";

export function createUserTag(interaction: GatewayInteraction): string | null {
  const user = interaction.member?.user ?? interaction.user;
  if (!user) {
    return null;
  }
  if (user.discriminator && user.discriminator !== "0") {
    return `${user.username}#${user.discriminator}`;
  }
  return user.username;
}

export function getOptionString(
  interaction: GatewayInteraction,
  name: string,
  required?: boolean,
): string | null {
  const options = interaction.data.options ?? [];
  const match = options.find((option) => option.name === name);
  if (!match || typeof match.value !== "string") {
    if (required) {
      throw new Error(`Brak wymaganej opcji: ${name}`);
    }
    return null;
  }
  return match.value;
}

export function isAdmin(interaction: GatewayInteraction): boolean {
  const permissions = interaction.member?.permissions;
  if (!permissions) {
    return false;
  }

  try {
    const value = BigInt(permissions);
    return (value & 0x8n) === 0x8n;
  } catch {
    return false;
  }
}

export async function deferReply(
  interaction: GatewayInteraction,
  token: string,
  ephemeral = false,
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (ephemeral) {
    data.flags = 64;
  }

  await axios.post(
    `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      type: 5,
      data,
    },
    {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function replyToInteraction(
  interaction: GatewayInteraction,
  token: string,
  payload: { content?: string; embeds?: unknown[]; ephemeral?: boolean },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (payload.content) {
    data.content = payload.content;
  }
  if (payload.embeds) {
    data.embeds = payload.embeds;
  }
  if (payload.ephemeral) {
    data.flags = 64;
  }

  await axios.post(
    `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      type: 4,
      data,
    },
    {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function editInteractionReply(
  interaction: GatewayInteraction,
  token: string,
  payload: { content?: string; embeds?: unknown[] },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (payload.content !== undefined) {
    data.content = payload.content;
  }
  if (payload.embeds !== undefined) {
    data.embeds = payload.embeds;
  }

  await axios.patch(
    `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
    data,
    {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function followUpInteraction(
  interaction: GatewayInteraction,
  token: string,
  payload: { content?: string; embeds?: unknown[]; ephemeral?: boolean },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (payload.content) {
    data.content = payload.content;
  }
  if (payload.embeds) {
    data.embeds = payload.embeds;
  }
  if (payload.ephemeral) {
    data.flags = 64;
  }

  await axios.post(
    `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}`,
    data,
    {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}
