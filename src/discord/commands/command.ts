import type { DiscordConfig } from "../../config/discord.js";

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
};

export type DiscordCommandOption = {
  type: 3;
  name: string;
  description: string;
  required?: boolean;
  choices?: ReadonlyArray<{ name: string; value: string }>;
};

export type DiscordCommandData = {
  name: string;
  description: string;
  type: 1;
  options?: ReadonlyArray<DiscordCommandOption>;
};

export type CommandInteraction = {
  commandName: string;
  userTag: string | null;
  isAdmin: boolean;
  options: {
    getString: (name: string, required?: boolean) => string | null;
  };
  reply: (payload: {
    content?: string;
    embeds?: DiscordEmbed[];
    ephemeral?: boolean;
  }) => Promise<void>;
  editReply?: (payload: {
    content?: string;
    embeds?: DiscordEmbed[];
  }) => Promise<void>;
  followUp?: (payload: {
    content?: string;
    embeds?: DiscordEmbed[];
    ephemeral?: boolean;
  }) => Promise<void>;
};

export type CommandContext = {
  getConfig: () => DiscordConfig;
  updateConfig: (partial: DiscordConfig) => DiscordConfig;
  setPresenceText: (text: string | null) => Promise<void>;
  requestRestart: () => void;
};

export type SlashCommand = {
  data: DiscordCommandData;
  adminOnly?: boolean;
  execute: (
    interaction: CommandInteraction,
    context: CommandContext,
  ) => Promise<void>;
};
