import type { DiscordCommandData, SlashCommand } from "./command.js";
import { loadOpenAIConfig } from "../../config/openai.js";
import { loadClaudeConfig } from "../../config/claude.js";
import { loadOllamaConfig } from "../../config/ollama.js";
import {
  streamOpenAIRequest,
  formatErrorForDiscord,
} from "../../functions/openai-request.js";
import {
  sendClaudeRequest,
  formatClaudeErrorForDiscord,
} from "../../functions/claude-request.js";
import { sendOllamaRequest } from "../../functions/ollama-request.js";
import { getOpenAIClient } from "../../openai/client.js";
import { getClaudeClient } from "../../claude/client.js";
import { OllamaClient } from "../../ollama/client.js";

function getCleanModelName(modelName: string): string {
  const colonIndex = modelName.indexOf(":");
  return colonIndex !== -1 ? modelName.substring(0, colonIndex) : modelName;
}

const data: DiscordCommandData = {
  name: "ask",
  description: "Ask AI a question (OpenAI, Claude, or Ollama)",
  type: 1,
  options: [
    {
      type: 3,
      name: "provider",
      description: "AI provider (openai, claude, or ollama)",
      required: true,
      choices: [
        { name: "OpenAI", value: "openai" },
        { name: "Claude", value: "claude" },
        { name: "Ollama", value: "ollama" },
      ],
    },
    {
      type: 3,
      name: "prompt",
      description: "Your question or prompt",
      required: true,
    },
    {
      type: 3,
      name: "model",
      description: "Model to use (optional, uses default agent)",
      required: false,
    },
    {
      type: 3,
      name: "temperature",
      description:
        "Creativity level (0-2 for OpenAI, 0-1 for Claude, default 0.7)",
      required: false,
    },
  ],
};

export const command: SlashCommand = {
  data,
  async execute(interaction) {
    const prompt = interaction.options.getString("prompt");
    const providerChoice = interaction.options.getString("provider");
    const modelOverride = interaction.options.getString("model");
    const temperatureStr = interaction.options.getString("temperature");

    if (!prompt) {
      await interaction.reply({
        content: "> Prompt is required",
        ephemeral: true,
      });
      return;
    }

    const openaiConfig = loadOpenAIConfig();
    const claudeConfig = loadClaudeConfig();
    const ollamaConfig = loadOllamaConfig();

    const openaiAvailable = openaiConfig.enabled && openaiConfig.apiKey;
    const claudeAvailable = claudeConfig.enabled && claudeConfig.apiKey;
    const ollamaAvailable = ollamaConfig.enabled;

    if (!openaiAvailable && !claudeAvailable && !ollamaAvailable) {
      await interaction.reply({
        content:
          "> No AI provider configured. Set up OpenAI with `openokapi agent openai --setkey`, Claude with `openokapi agent claude --setkey`, or Ollama with `openokapi agent ollama --seturl`",
        ephemeral: true,
      });
      return;
    }

    let useProvider: "openai" | "claude" | "ollama";

    if (providerChoice) {
      useProvider = providerChoice as "openai" | "claude" | "ollama";
      if (useProvider === "openai" && !openaiAvailable) {
        await interaction.reply({
          content:
            "> OpenAI is not configured. Set it up with `openokapi agent openai --setkey`",
          ephemeral: true,
        });
        return;
      }
      if (useProvider === "claude" && !claudeAvailable) {
        await interaction.reply({
          content:
            "> Claude is not configured. Set it up with `openokapi agent claude --setkey`",
          ephemeral: true,
        });
        return;
      }
      if (useProvider === "ollama" && !ollamaAvailable) {
        await interaction.reply({
          content:
            "> Ollama is not configured. Set it up with `openokapi agent ollama --seturl`",
          ephemeral: true,
        });
        return;
      }
    } else {
      useProvider = openaiAvailable
        ? "openai"
        : claudeAvailable
          ? "claude"
          : "ollama";
    }

    const config =
      useProvider === "openai"
        ? openaiConfig
        : useProvider === "claude"
          ? claudeConfig
          : ollamaConfig;

    const model = modelOverride || config.defaultModel;
    if (!model) {
      const providerName =
        useProvider === "openai"
          ? "OpenAI"
          : useProvider === "claude"
            ? "Claude"
            : "Ollama";
      const command =
        useProvider === "openai"
          ? "openokapi agent openai --setagent <model>"
          : useProvider === "claude"
            ? "openokapi agent claude --setagent <model>"
            : "openokapi agent ollama --setagent <model>";
      await interaction.reply({
        content: `> No default model configured for ${providerName}. Set one with \`${command}\``,
        ephemeral: true,
      });
      return;
    }

    let temperature = 0.7;
    if (temperatureStr) {
      const temp = parseFloat(temperatureStr);
      const maxTemp = useProvider === "openai" ? 2 : 1;
      if (!isNaN(temp) && temp >= 0 && temp <= maxTemp) {
        temperature = temp;
      }
    }

    if (useProvider === "openai") {
      const client = getOpenAIClient();
      const validation = await client.validateApiKey(model);

      if (!validation.valid) {
        await interaction.reply({
          content: `> **API Error:** ${validation.error || "Cannot use API key"}`,
          ephemeral: true,
        });
        return;
      }
    } else if (useProvider === "claude") {
      const client = getClaudeClient();
      const validation = await client.validateApiKey(model);

      if (!validation.valid) {
        await interaction.reply({
          content: `> **API Error:** ${validation.error || "Cannot use API key"}`,
          ephemeral: true,
        });
        return;
      }
    } else if (useProvider === "ollama") {
      const client = new OllamaClient();
      const modelExists = await client.modelExists(model);

      if (!modelExists) {
        await interaction.reply({
          content: `> **Model Error:** Model '${model}' not found. Pull it with \`openokapi agent ollama --pull ${model}\``,
          ephemeral: true,
        });
        return;
      }
    }

    try {
      let fullResponse = "";

      if (useProvider === "openai") {
        const streamResult = await streamOpenAIRequest({
          model,
          prompt,
          temperature,
          history: {
            source: "discord",
            action: "stream",
          },
        });

        if (!streamResult.success || !streamResult.stream) {
          const errorMsg = `> **Error:** ${formatErrorForDiscord(streamResult.error)}`;

          if (interaction.editReply) {
            try {
              await interaction.editReply({
                content: errorMsg,
                embeds: [],
              });
            } catch (editError) {
              await interaction.reply({
                content: errorMsg,
                ephemeral: true,
              });
            }
          } else {
            await interaction.reply({
              content: errorMsg,
              ephemeral: true,
            });
          }
          return;
        }

        for await (const chunk of streamResult.stream) {
          fullResponse += chunk;
        }
      } else if (useProvider === "claude") {
        const claudeResult = await sendClaudeRequest({
          model,
          prompt,
          temperature,
          maxTokens: 1024,
          history: {
            source: "discord",
            action: "ask",
          },
        });

        if (!claudeResult.success || !claudeResult.content) {
          const errorMsg = `> **Error:** ${formatClaudeErrorForDiscord(claudeResult.error)}`;

          if (interaction.editReply) {
            try {
              await interaction.editReply({
                content: errorMsg,
                embeds: [],
              });
            } catch (editError) {
              await interaction.reply({
                content: errorMsg,
                ephemeral: true,
              });
            }
          } else {
            await interaction.reply({
              content: errorMsg,
              ephemeral: true,
            });
          }
          return;
        }

        fullResponse = claudeResult.content;
      } else if (useProvider === "ollama") {
        try {
          fullResponse = await sendOllamaRequest(model, prompt, "chat", {
            source: "discord",
            action: "chat",
          });
        } catch (error: any) {
          const errorMsg = `> **Error:** ${error.message || "Failed to get response from Ollama"}`;

          if (interaction.editReply) {
            try {
              await interaction.editReply({
                content: errorMsg,
                embeds: [],
              });
            } catch (editError) {
              await interaction.reply({
                content: errorMsg,
                ephemeral: true,
              });
            }
          } else {
            await interaction.reply({
              content: errorMsg,
              ephemeral: true,
            });
          }
          return;
        }
      }

      if (!fullResponse) {
        const noResponseMsg = "> No response received from API";

        if (interaction.editReply) {
          try {
            await interaction.editReply({
              content: noResponseMsg,
              embeds: [],
            });
          } catch (editError) {
            console.error("Failed to edit reply:", editError);
            await interaction.reply({
              content: noResponseMsg,
              ephemeral: true,
            });
          }
        } else {
          await interaction.reply({
            content: noResponseMsg,
            ephemeral: true,
          });
        }
        return;
      }

      const maxLength = 2000;
      const responses: string[] = [];

      if (fullResponse.length > maxLength) {
        for (let i = 0; i < fullResponse.length; i += maxLength) {
          responses.push(fullResponse.slice(i, i + maxLength));
        }
      } else {
        responses.push(fullResponse);
      }

      for (let i = 0; i < responses.length; i++) {
        const providerIcon =
          useProvider === "openai"
            ? "🤖"
            : useProvider === "claude"
              ? "🧠"
              : "🦙";
        const providerColor =
          useProvider === "openai"
            ? 0x10a37f
            : useProvider === "claude"
              ? 0xd97757
              : 0x000000;
        const providerName =
          useProvider === "openai"
            ? "OpenAI"
            : useProvider === "claude"
              ? "Claude"
              : "Ollama";
        const cleanModelName = getCleanModelName(model);

        const embed = {
          title: `${providerIcon} ${cleanModelName}`,
          description:
            responses.length > 1
              ? `Response (Part ${i + 1}/${responses.length})`
              : "Response",
          color: providerColor,
          fields: [
            {
              name: "Provider",
              value: providerName,
              inline: true,
            },
            {
              name: "Model",
              value: cleanModelName,
              inline: true,
            },
            {
              name: "Temperature",
              value: temperature.toString(),
              inline: true,
            },
            {
              name: "Prompt",
              value: prompt.length > 100 ? prompt.slice(0, 97) + "..." : prompt,
              inline: false,
            },
          ] as any,
          timestamp: new Date().toISOString(),
        };

        if (i === 0) {
          if (interaction.editReply) {
            await interaction.editReply({
              content: responses[i] || "",
              embeds: [embed],
            });
          }
        } else if (interaction.followUp) {
          await interaction.followUp({
            content: responses[i] || "",
            embeds: [embed],
            ephemeral: false,
          });
        }
      }
    } catch (error: any) {
      console.error("Caught error:", error);
      const errorMessage =
        useProvider === "openai"
          ? formatErrorForDiscord({
              type: "unknown",
              message: error.message || "Unknown error",
            })
          : formatClaudeErrorForDiscord({
              type: "unknown",
              message: error.message || "Unknown error",
            });
      await interaction.reply({
        content: `> **Error:** ${errorMessage}`,
        ephemeral: true,
      });
    }
  },
};
