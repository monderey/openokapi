import type { DiscordCommandData, SlashCommand } from "./command.js";

const data: DiscordCommandData = {
  name: "restart",
  description: "Restarts the bot",
  type: 1,
};

export const command: SlashCommand = {
  data,
  adminOnly: true,
  async execute(interaction, context) {
    const embed = {
      title: "Restart",
      description: "The bot will be restarted.",
      color: 0xf59e0b,
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed], ephemeral: false });
    context.requestRestart();
  },
};
