import chalk from "chalk";
import { loadClaudeConfig, loadClaudeModels } from "../../../config/claude.js";
import { line, width } from "../../../utils/cliTypes.js";

export async function runClaudeStatus(): Promise<void> {
  const config = loadClaudeConfig();
  const models = loadClaudeModels();

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Claude Status"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Status") +
      chalk.dim(" ─────────────────────────────────────────────────┐"),
  );
  console.log(line(""));

  const apiKeyStatus = config.apiKey
    ? chalk.green("✓ Configured")
    : chalk.red("✗ Not configured");
  const truncatedKey = config.apiKey
    ? `${config.apiKey.slice(0, 10)}...${config.apiKey.slice(-10)}`
    : "N/A";
  console.log(line(`  API Key:          ${apiKeyStatus} (${truncatedKey})`));

  const enabledStatus = config.enabled
    ? chalk.green("✓ Enabled")
    : chalk.red("✗ Disabled");
  console.log(line(`  Status:           ${enabledStatus}`));

  const defaultModel = config.defaultModel || chalk.dim("None set");
  const defaultModelDisplay = config.defaultModel
    ? chalk.cyan(defaultModel)
    : defaultModel;
  console.log(line(`  Default Agent:    ${defaultModelDisplay}`));

  console.log(line(`  Available Models: ${models.length}`));

  if (models.length > 0) {
    console.log(line(""));
    console.log(line(`  Models:`));
    models.slice(0, 5).forEach((model) => {
      console.log(line(`    • ${model.id}`));
    });
    if (models.length > 5) {
      console.log(line(`    ... and ${models.length - 5} more`));
    }
  }

  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
