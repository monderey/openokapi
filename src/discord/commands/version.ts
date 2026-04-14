import type { DiscordCommandData, SlashCommand } from "./command.js";
import { DISCORD_API_BASE, versionDiscord } from "../types.js";

const data: DiscordCommandData = {
  name: "version",
  description: "Shows Discord integration version and used API",
  type: 1,
};

export const command: SlashCommand = {
  data,
  async execute(interaction) {
    const embed = {
      title: "Discord Integration Version",
      description: "Discord integration information",
      color: 0x3b82f6,
      fields: [
        { name: "Integration version", value: versionDiscord, inline: true },
        { name: "Discord API", value: DISCORD_API_BASE, inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
