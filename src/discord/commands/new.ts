import type { DiscordCommandData, SlashCommand } from "./command.js";

const data: DiscordCommandData = {
  name: "new",
  description: "Creates a new session/conversation",
  type: 1,
};

export const command: SlashCommand = {
  data,
  async execute(interaction) {
    const embed = {
      title: "New session",
      description: "Created a new OpenOKAPI session.",
      color: 0x3b82f6,
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
