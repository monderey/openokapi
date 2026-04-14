import chalk from "chalk";
import { updateAppConfig } from "../../../config/app.js";
import { generateApiKey } from "../../../functions/generate-api-key.js";
import { line, width } from "../../../utils/cliTypes.js";

export async function runGenerateApiKey(): Promise<void> {
  const apiKey = generateApiKey();
  updateAppConfig({ apiKey });

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Generate ApiKey"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Generate") +
      chalk.dim(" ───────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  ${chalk.green("✓")} New API key generated`));
  console.log(line(""));
  console.log(line(`  Key: ${chalk.cyan(apiKey)}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
