import type { DiscordCommandData, SlashCommand } from "./command.js";

const data: DiscordCommandData = {
  name: "usage",
  description: "Enables or disables usage",
  type: 1,
  options: [
    {
      type: 3,
      name: "mode",
      description: "Usage mode",
      required: true,
      choices: [
        { name: "on", value: "on" },
        { name: "off", value: "off" },
      ],
    },
  ],
};

export const command: SlashCommand = {
  data,
  adminOnly: true,
  async execute(interaction, context) {
    const mode = interaction.options.getString("mode", true);
    const usageEnabled = mode === "on";
    context.updateConfig({ usageEnabled });

    const embed = {
      title: "Usage",
      description: `Usage set to: **${usageEnabled ? "on" : "off"}**`,
      color: usageEnabled ? 0x10b981 : 0xef4444,
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
