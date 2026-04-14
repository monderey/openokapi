import type { DiscordCommandData, SlashCommand } from "./command.js";

const data: DiscordCommandData = {
  name: "status",
  description: "Displays or sets bot status",
  type: 1,
  options: [
    {
      type: 3,
      name: "text",
      description: "Status text (presence)",
      required: false,
    },
  ],
} as const;

export const command: SlashCommand = {
  data,
  async execute(interaction, context) {
    const text = interaction.options.getString("text");
    if (text && text.trim().length > 0) {
      if (!interaction.isAdmin) {
        await interaction.reply({
          embeds: [
            {
              title: "No permissions",
              description: "Only administrator can change bot status.",
              color: 0xf59e0b,
              timestamp: new Date().toISOString(),
            },
          ],
          ephemeral: true,
        });
        return;
      }
      context.updateConfig({ presenceText: text.trim() });
      await context.setPresenceText(text.trim());
    }

    const updated = context.getConfig();
    const embed = {
      title: "Bot status",
      description: "Current OpenOKAPI settings",
      color: 0x5b8c5a,
      fields: [
        {
          name: "Enabled",
          value: updated.enabled ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Usage",
          value: updated.usageEnabled ? "On" : "Off",
          inline: true,
        },
        {
          name: "Presence",
          value: updated.presenceText ? updated.presenceText : "None",
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
