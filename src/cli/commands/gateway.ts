import chalk from "chalk";
import { GatewayServer } from "../../ws/server.js";
import { loadAppConfig } from "../../config/app.js";
import { line, width } from "../../utils/cliTypes.js";

export async function runGateway(portArg?: string): Promise<void> {
  const config = loadAppConfig();

  if (!config.apiKey) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Gateway"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.red("Error") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    console.log(
      line(
        `  ${chalk.red("✗")} API key not configured. Run 'openokapi generate api-key' first.`,
      ),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  const port = portArg
    ? parseInt(portArg, 10)
    : parseInt(process.env.GATEWAY_PORT || "16273", 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    console.log();
    console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Gateway"));
    console.log(chalk.dim("│"));
    console.log(
      chalk.cyan("◇  ") +
        chalk.bold.red("Error") +
        chalk.dim(" ───────────────────────────────────────────────────┐"),
    );
    console.log(line(""));
    console.log(line(`  ${chalk.red("✗")} Invalid port number: ${portArg}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim("┌  ") + chalk.bold.green("OpenOKAPI Gateway"));
  console.log(chalk.dim("│"));
  console.log(
    chalk.cyan("◇  ") +
      chalk.bold.green("Starting") +
      chalk.dim(" ───────────────────────────────────────────────┐"),
  );
  console.log(line(""));
  console.log(line(`  ${chalk.cyan("Port:")} ${port}`));
  console.log(
    line(`  ${chalk.cyan("API Key:")} ${chalk.dim("***configured***")}`),
  );
  const userAgent = config.userAgent || "OPENOKAPI/1.0";
  console.log(
    line(`  ${chalk.cyan("User-Agent:")} ${chalk.yellow(userAgent)}`),
  );
  console.log(line(""));

  try {
    const server = new GatewayServer({ port });
    await server.start();

    console.log(line(`  ${chalk.green("Server started successfully")}`));
    console.log(line(""));
    console.log(
      line(`  ${chalk.cyan("HTTP API:")} http://localhost:${port}/api`),
    );
    console.log(line(`  ${chalk.cyan("WebSocket:")} ws://localhost:${port}`));
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();

    process.on("SIGINT", async () => {
      console.log();
      console.log(chalk.yellow("\n  Shutting down server..."));
      await server.stop();
      console.log(chalk.green("  Server stopped"));
      console.log();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(line(`  ${chalk.red("✗")} Failed to start server`));
    console.log(line(""));
    console.log(
      line(
        `  ${chalk.red("Error:")} ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    console.log(line(""));
    console.log(`${chalk.dim("└" + "─".repeat(width - 2) + "┘")}`);
    console.log();
    process.exit(1);
  }
}
