import chalk from "chalk";
import * as readline from "readline";
import axios from "axios";
import { updateDiscordConfig } from "../../config/discord.js";
import { updateOpenAIConfig } from "../../config/openai.js";
import { updateClaudeConfig } from "../../config/claude.js";
import { cliVerifyToken } from "../../discord/utils/cliVerifyToken.js";
import { getVersion } from "../../version.js";

export async function runOnboard(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const waitForKeypress = async <T>(
    options: readonly T[],
    render: (selectedIndex: number) => void,
  ): Promise<T> => {
    if (options.length === 0) {
      throw new Error("No options provided");
    }
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    return new Promise((resolve) => {
      let selectedIndex = 0;
      clearScreen();
      render(selectedIndex);

      const onKeypress = (_: string, key: readline.Key) => {
        if (key.name === "up") {
          selectedIndex = (selectedIndex - 1 + options.length) % options.length;
          clearScreen();
          render(selectedIndex);
          return;
        }

        if (key.name === "down") {
          selectedIndex = (selectedIndex + 1) % options.length;
          clearScreen();
          render(selectedIndex);
          return;
        }

        if (key.name === "return") {
          process.stdin.off("keypress", onKeypress);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdout.write("\n");
          resolve(options[selectedIndex]!);
        }
      };

      process.stdin.on("keypress", onKeypress);
    });
  };

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  const clearScreen = () => {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    process.stdout.write("\x1b[3J");
  };

  const waitForYesNo = async (
    render: (accepted: boolean) => void,
  ): Promise<boolean> => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    return new Promise((resolve) => {
      let accepted = true;
      clearScreen();
      render(accepted);

      const onKeypress = (_: string, key: readline.Key) => {
        if (key.name === "left" || key.name === "right") {
          accepted = !accepted;
          clearScreen();
          render(accepted);
          return;
        }

        if (key.name === "return") {
          process.stdin.off("keypress", onKeypress);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdout.write("\n");
          resolve(accepted);
        }
      };

      process.stdin.on("keypress", onKeypress);
    });
  };

  const version = await getVersion();

  const renderHeader = () => {
    console.log();
    console.log(
      chalk.bold.green(" OpenOKAPI ") + chalk.greenBright(`v${version}`),
    );
    console.log(chalk.dim(" Start configuring your OpenOKAPI version"));
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Onboarding Wizard"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("Information") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(
      chalk.dim(
        "│                                                                 │",
      ),
    );
    console.log(
      chalk.dim(
        "│  You can change the configuration later at any time; the        │",
      ),
    );
    console.log(
      chalk.dim(
        "│  current configuration is preliminary to help you get started.  │",
      ),
    );
    console.log(
      chalk.dim(
        "│  Configuration is optional if you don't want to use OpenOKAPI.  │",
      ),
    );
    console.log(
      chalk.dim(
        "│                                                                 │",
      ),
    );
    console.log(
      chalk.dim(
        "├─────────────────────────────────────────────────────────────────┘",
      ),
    );
  };

  const configureDiscord = async (): Promise<void> => {
    const renderStep3 = () => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 3: Discord Bot Token"));
      console.log(
        chalk.dim("│  ") +
          chalk.dim(
            "Get your token from: https://discord.com/developers/applications",
          ),
      );
      console.log(chalk.dim("│"));
    };

    renderStep3();
    const token = await question(
      chalk.dim("└  ") + chalk.cyan("Enter your Discord bot token: "),
    );

    if (!token || token.trim().length === 0) {
      console.log(chalk.red("Token cannot be empty"));
      return;
    }

    const verification = await cliVerifyToken(token.trim());
    if (!verification.ok) {
      if (verification.reason === "invalid") {
        console.log(chalk.red("Invalid token. Please enter a valid token."));
      } else {
        console.log(
          chalk.red("Error connecting to Discord API. Try again later."),
        );
      }
      return;
    }

    const renderStep4 = () => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 4: Bot Presence Text"));
      console.log(chalk.dim("│"));
    };

    renderStep4();
    const presenceText = await question(
      chalk.dim("└  ") +
        chalk.cyan("Enter bot presence text (default: OpenOKAPI): "),
    );

    const renderStep5 = (enabled: boolean) => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 5: Usage Tracking?"));
      console.log(chalk.dim("│"));

      const yesDot = enabled ? chalk.green("●") : chalk.dim("○");
      const noDot = enabled ? chalk.dim("○") : chalk.green("●");
      const yesLabel = enabled ? chalk.gray("Yes") : chalk.dim("Yes");
      const noLabel = enabled ? chalk.dim("No") : chalk.gray("No");

      console.log(
        chalk.dim("└  ") + `${yesDot} ${yesLabel} / ${noDot} ${noLabel}`,
      );
    };

    const usageEnabled = await waitForYesNo(renderStep5);

    updateDiscordConfig({
      token: token.trim(),
      presenceText: presenceText.trim() || "OpenOKAPI",
      usageEnabled,
      enabled: true,
    });

    clearScreen();
    renderHeader();
    console.log(chalk.dim("│"));
    console.log(
      chalk.bold.green("✓ Discord configuration saved successfully!"),
    );
    console.log(chalk.dim("│"));
    console.log(chalk.dim("└  Start your bot with:"));
    console.log(chalk.cyan("   ● openokapi agent discord --status on"));
    console.log();
  };

  const configureOpenAI = async (): Promise<void> => {
    const renderStep3 = () => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 3: OpenAI API Key"));
      console.log(
        chalk.dim("│  ") +
          chalk.dim(
            "Get your API key from: https://platform.openai.com/api-keys",
          ),
      );
      console.log(chalk.dim("│"));
    };

    renderStep3();
    const apiKey = await question(
      chalk.dim("└  ") + chalk.cyan("Enter your OpenAI API key (sk-...): "),
    );

    if (!apiKey || apiKey.trim().length === 0) {
      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.yellow("OpenAI API key not provided, skipping..."),
      );
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.red("Invalid API key format. Must start with 'sk-'"),
      );
      return;
    }

    clearScreen();
    renderHeader();
    console.log(chalk.dim("│"));
    console.log(
      chalk.dim("└  ") + "Waiting: " + chalk.cyan("Validating API key..."),
    );

    try {
      const client = axios.create({
        baseURL: "https://api.openai.com/v1",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });

      await client.get("/models", { params: { limit: 1 } });

      updateOpenAIConfig({
        apiKey: apiKey.trim(),
        enabled: true,
      });

      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("├  ") + "Success: " + chalk.cyan("API key is valid"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.bold.green("OpenAI configuration saved successfully!"),
      );
      console.log();
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.red("✗ API key validation failed"));
      console.log(chalk.dim("│"));

      if (status === 401) {
        console.log(chalk.dim("└  ") + chalk.red("Invalid or expired API key"));
      } else if (status === 429) {
        console.log(
          chalk.dim("└  ") + chalk.red("Rate limited. Try again later."),
        );
      } else {
        console.log(chalk.dim("└  ") + chalk.red(message || "Unknown error"));
      }
      console.log();
    }
  };

  const configureClaude = async (): Promise<void> => {
    const renderStep3 = () => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 3: Claude API Key"));
      console.log(
        chalk.dim("│  ") +
          chalk.dim(
            "Get your API key from: https://console.anthropic.com/settings/keys",
          ),
      );
      console.log(chalk.dim("│"));
    };

    renderStep3();
    const apiKey = await question(
      chalk.dim("└  ") + chalk.cyan("Enter your Claude API key (sk-ant-...): "),
    );

    if (!apiKey || apiKey.trim().length === 0) {
      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.yellow("Claude API key not provided, skipping..."),
      );
      return;
    }

    if (!apiKey.startsWith("sk-ant-")) {
      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.red("Invalid API key format. Must start with 'sk-ant-'"),
      );
      return;
    }

    clearScreen();
    renderHeader();
    console.log(chalk.dim("│"));
    console.log(
      chalk.dim("└  ") + "Waiting: " + chalk.cyan("Validating API key..."),
    );

    try {
      const client = axios.create({
        baseURL: "https://api.anthropic.com/v1",
        headers: {
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });

      await client.get("/models", { params: { limit: 1 } });

      updateClaudeConfig({
        apiKey: apiKey.trim(),
        enabled: true,
      });

      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("├  ") + "Success: " + chalk.cyan("API key is valid"),
      );
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("└  ") +
          chalk.bold.green("Claude configuration saved successfully!"),
      );
      console.log();
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      clearScreen();
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.red("✗ API key validation failed"));
      console.log(chalk.dim("│"));

      if (status === 401) {
        console.log(chalk.dim("└  ") + chalk.red("Invalid or expired API key"));
      } else if (status === 429) {
        console.log(
          chalk.dim("└  ") + chalk.red("Rate limited. Try again later."),
        );
      } else {
        console.log(chalk.dim("└  ") + chalk.red(message || "Unknown error"));
      }
      console.log();
    }
  };

  try {
    const renderRiskAcceptance = (accepted: boolean) => {
      process.stdout.write("\x1b[H\x1b[2J\x1b[3J");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(
        chalk.dim("├  ") +
          chalk.green(
            "Step 1: I realize this is powerful and there is a potential",
          ),
      );
      console.log(
        chalk.dim("│  ") +
          chalk.green("        risk of data loss. Are you continuing?"),
      );
      console.log(chalk.dim("│"));

      const yesDot = accepted ? chalk.green("●") : chalk.dim("○");
      const noDot = accepted ? chalk.dim("○") : chalk.green("●");
      const yesLabel = accepted ? chalk.gray("Yes") : chalk.dim("Yes");
      const noLabel = accepted ? chalk.dim("No") : chalk.gray("No");

      console.log(
        chalk.dim("└  ") + `${yesDot} ${yesLabel} / ${noDot} ${noLabel}`,
      );
    };

    const acceptedRisk = await waitForYesNo(renderRiskAcceptance);
    if (!acceptedRisk) {
      rl.close();
      return;
    }

    const integrations = ["Discord", "OpenAI", "Claude"] as const;
    const renderIntegrationMenu = (selectedIndex: number) => {
      process.stdout.write("\x1b[2J\x1b[0f");
      renderHeader();
      console.log(chalk.dim("│"));
      console.log(chalk.dim("├  ") + chalk.green("Step 2: Choose integration"));
      console.log(chalk.dim("│"));
      integrations.forEach((integration, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? chalk.green("❯") : " ";
        const label = isSelected ? chalk.bold.cyan(integration) : integration;
        const isLast = index === integrations.length - 1;
        const boxChar = isLast ? "└" : "├";
        console.log(chalk.dim(`${boxChar}  `) + `${prefix} ${label}`);
      });
    };

    const selectedIntegration = await waitForKeypress(
      integrations,
      renderIntegrationMenu,
    );

    if (selectedIntegration === "Discord") {
      await configureDiscord();
    } else if (selectedIntegration === "OpenAI") {
      await configureOpenAI();
    } else if (selectedIntegration === "Claude") {
      await configureClaude();
    }

    rl.close();
  } catch (error) {
    console.log(chalk.red("✗ Onboard failed:"), error);
    rl.close();
  }
}
