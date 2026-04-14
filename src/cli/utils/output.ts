import chalk from "chalk";
import { line, width } from "../../utils/cliTypes.js";

export const output = {
  info: (message: string) => console.log(chalk.blue("ℹ ") + message),
  success: (message: string) => console.log(chalk.green("✔ ") + message),
  warning: (message: string) => console.log(chalk.yellow("⚠ ") + message),
  error: (message: string) => console.log(chalk.red("✖ ") + message),
  loading: (message: string) =>
    process.stdout.write(chalk.cyan("◌ ") + message),
  clear: () => process.stdout.write("\r\x1b[K"),
  box: (title: string, content: string) => {
    console.log();
    console.log(
      chalk.dim("┌──") + chalk.bold.green(` ${title} `) + chalk.dim("──"),
    );
    console.log(chalk.dim("│"));
    content.split("\n").forEach((line) => {
      console.log(chalk.dim("│  ") + line);
    });
    console.log(chalk.dim("│"));
    console.log(chalk.dim("└" + "─".repeat(40)));
    console.log();
  },
};

export function printWelcome(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("Welcome to OpenOKAPI!"));
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
      "│  OpenOKAPI is currently in a test version, please report any    │",
    ),
  );
  console.log(
    chalk.dim(
      "│  errors or bugs you encounter to us on the discord server or    │",
    ),
  );
  console.log(
    chalk.dim(
      "│  by filing an issue in the github repository.                   │",
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
  console.log(chalk.dim("│"));
  console.log(
    chalk.dim("├  ") +
      chalk.green("Commands you can run after the onboarding process:"),
  );
  console.log(chalk.dim("│"));
  console.log(`${chalk.dim("├ ")} Help: ${chalk.cyan("openokapi help")}`);
  console.log(`${chalk.dim("└ ")} Config: ${chalk.cyan("openokapi onboard")}`);
  console.log();
}

export function printHelp(): void {
  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI CLI Help"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Default commands") +
      chalk.dim(" ───────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  Help: ${chalk.cyan("openokapi help")}`));
  console.log(line(`  Config: ${chalk.cyan("openokapi onboard")}`));
  console.log(line(`  Version: ${chalk.cyan("openokapi version")}`));
  console.log(line(`  Websocket: ${chalk.cyan("openokapi gateway [--port]")}`));
  console.log(line(""));
  console.log(`${chalk.dim("├" + "─".repeat(width - 2) + "┘")}`);
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Config commands") +
      chalk.dim(" ────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  Generate API key: ${chalk.cyan("openokapi generate api-key")}`),
  );
  console.log(
    line(`  Show API key: ${chalk.cyan("openokapi config --show api-key")}`),
  );
  console.log(
    line(
      `  Set User Agent: ${chalk.cyan("openokapi config --set-user-agent")}`,
    ),
  );
  console.log(line(""));
  console.log(`${chalk.dim("├" + "─".repeat(width - 2) + "┘")}`);
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Agent commands") +
      chalk.dim(" ─────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(
    line(`  Discord agent: ${chalk.cyan("openokapi agent discord")}`),
  );
  console.log(line(`  OpenAI agent: ${chalk.cyan("openokapi agent openai")}`));
  console.log(line(`  Claude agent: ${chalk.cyan("openokapi agent claude")}`));
  console.log(line(`  Ollama agent: ${chalk.cyan("openokapi agent ollama")}`));
  console.log(line(""));
  console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
  console.log();
}
