import chalk from "chalk";
import { claudeClient } from "../../../claude/client.js";
import { loadClaudeConfig, saveClaudeModels } from "../../../config/claude.js";
import { line, width } from "../../../utils/cliTypes.js";
import { printWrappedMessage } from "../../utils/formatting.js";

export async function runUpdateModels(): Promise<void> {
  const config = loadClaudeConfig();

  if (!config.apiKey) {
    console.log();
    console.log(
      chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude UpdateModels"),
    );
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.green("UpdateModels") +
        chalk.dim(" ────────────────────────────────────────┐"),
    );
    console.log(line(""));
    printWrappedMessage(
      `Error: ${chalk.red("Claude API key not configured. Use --setkey first.")}`,
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(
    chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude UpdateModels"),
  );
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("UpdateModels") +
      chalk.dim(" ───────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line("  Fetching available models from Claude API..."));

  try {
    claudeClient.instance.setApiKey(config.apiKey);
    const models = await claudeClient.instance.listModels();

    const formatted = models.map((model) => {
      const base = {
        id: model.id,
        name: model.display_name || model.id,
      };

      return {
        ...base,
        ...(model.display_name ? { display_name: model.display_name } : {}),
        ...(model.created_at ? { created_at: model.created_at } : {}),
        ...(model.type ? { type: model.type } : {}),
      };
    });

    saveClaudeModels(formatted);

    console.log(line(""));
    console.log(
      line(
        `  Success: ${chalk.cyan("Successfully fetched")} ${chalk.green(formatted.length)} ${chalk.cyan("models")}`,
      ),
    );
    console.log(line(""));

    formatted.slice(0, 5).forEach((model) => {
      console.log(line(`  • ${model.id}`));
    });

    if (formatted.length > 5) {
      console.log(line(`  ... and ${formatted.length - 5} more`));
    }

    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  } catch (error: unknown) {
    const err = error as Error;
    console.log(line(""));
    console.log(line(`  ${chalk.red("✗")} Error: ${err.message}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  }
  console.log();
}
