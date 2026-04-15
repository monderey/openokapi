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
  console.log(
    line(
      `  Batch: ${chalk.cyan("openokapi batch --file ./requests.json [--concurrency N]")}`,
    ),
  );
  console.log(
    line(
      `  History: ${chalk.cyan("openokapi history [--show|--stats|--clear]")}`,
    ),
  );
  console.log(
    line(
      `  Profiles: ${chalk.cyan("openokapi profile [--list|--show|--set|--run]")}`,
    ),
  );
  console.log(
    line(
      `  Cache: ${chalk.cyan("openokapi cache [--provider ... --exclude-model ...] [--clear]")}`,
    ),
  );
  console.log(
    line(
      `  Pricing: ${chalk.cyan("openokapi pricing [--set|--delete|--provider|--match|--input|--output]")}`,
    ),
  );
  console.log(line(`  Costs: ${chalk.cyan("openokapi costs [--days N]")}`));
  console.log(
    line(`  Replay: ${chalk.cyan("openokapi replay --id <history-id>")}`),
  );
  console.log(
    line(
      `  Chat: ${chalk.cyan("openokapi chat --start|--list|--id <conversation-id> --ask <prompt>|--summarize")}`,
    ),
  );
  console.log(
    line(
      `  Capabilities: ${chalk.cyan("openokapi capabilities [--enable|--disable <key>]")}`,
    ),
  );
  console.log(
    line(
      `  Integrations: ${chalk.cyan("openokapi integrations [--set|--delete|--dispatch]")}`,
    ),
  );
  console.log(
    line(
      `  Router: ${chalk.cyan("openokapi router [--strategy balanced|cost|speed|reliability]")}`,
    ),
  );
  console.log(
    line(
      `  Guardrails: ${chalk.cyan("openokapi guardrails [--add-block <term>] [--scan <text>]")}`,
    ),
  );
  console.log(
    line(`  Eval: ${chalk.cyan("openokapi eval --prompt ... --response ...")}`),
  );
  console.log(
    line(
      `  Budget: ${chalk.cyan("openokapi budget [--set --enabled true --daily 10 --monthly 200]")}`,
    ),
  );
  console.log(
    line(
      `  Automations: ${chalk.cyan("openokapi automations [--set|--delete|--simulate]")}`,
    ),
  );
  console.log(
    line(
      `  Hooks: ${chalk.cyan("openokapi hooks [--set|--delete|--simulate]")}`,
    ),
  );
  console.log(
    line(
      `  Heartbeat: ${chalk.cyan("openokapi heartbeat [--set|--run|--reload]")}`,
    ),
  );
  console.log(
    line(
      `  Standing Orders: ${chalk.cyan("openokapi standing-orders [--set|--delete|--preview]")}`,
    ),
  );
  console.log(
    line(
      `  Scheduler: ${chalk.cyan("openokapi scheduler [--set|--delete|--run|--reload]")}`,
    ),
  );
  console.log(
    line(
      `  Task Flow: ${chalk.cyan("openokapi task-flow [--set|--delete|--run|--cancel]")}`,
    ),
  );
  console.log(
    line(
      `  Tasks: ${chalk.cyan("openokapi tasks [list|show <lookup>|cancel <lookup>|notify <lookup> <policy>|audit|maintenance (--status|--apply)|flow (list|show|cancel|audit|maintenance)]")}`,
    ),
  );
  console.log(
    line(
      `  Doctor: ${chalk.cyan("openokapi doctor [--repair] [--retention-days N] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Backup: ${chalk.cyan("openokapi backup [list|create|verify <id>] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Reset: ${chalk.cyan("openokapi reset --scope <config|config+history|full> [--dry-run] [--yes] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Security: ${chalk.cyan("openokapi security [audit] [--fix] [--json]")}`,
    ),
  );
  console.log(
    line(`  Status: ${chalk.cyan("openokapi status [--deep] [--json]")}`),
  );
  console.log(
    line(
      `  Alerts: ${chalk.cyan("openokapi alerts [--limit N] [--deep] [--ignore-mute] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Incidents: ${chalk.cyan("openokapi incidents [list|create|show <id>|ack <id>|resolve <id>] [--force] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Maintenance: ${chalk.cyan("openokapi maintenance-windows [--set|--delete|--status] [--json]")}`,
    ),
  );
  console.log(
    line(
      `  Escalations: ${chalk.cyan("openokapi escalations [--set|--delete|--run] [--json]")}`,
    ),
  );
  console.log(line(`  Self Test: ${chalk.cyan("openokapi self-test")}`));
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
  console.log(
    line(
      `  Set Fallback: ${chalk.cyan("openokapi config --set-fallback <provider|off>")}`,
    ),
  );
  console.log(line(`  Profiles: ${chalk.cyan("openokapi profile")}`));
  console.log(line(`  Cache: ${chalk.cyan("openokapi cache")}`));
  console.log(line(`  Pricing: ${chalk.cyan("openokapi pricing")}`));
  console.log(line(`  Costs: ${chalk.cyan("openokapi costs")}`));
  console.log(line(`  Replay: ${chalk.cyan("openokapi replay")}`));
  console.log(line(`  Chat: ${chalk.cyan("openokapi chat")}`));
  console.log(line(`  Capabilities: ${chalk.cyan("openokapi capabilities")}`));
  console.log(line(`  Integrations: ${chalk.cyan("openokapi integrations")}`));
  console.log(line(`  Router: ${chalk.cyan("openokapi router")}`));
  console.log(line(`  Guardrails: ${chalk.cyan("openokapi guardrails")}`));
  console.log(line(`  Eval: ${chalk.cyan("openokapi eval")}`));
  console.log(line(`  Budget: ${chalk.cyan("openokapi budget")}`));
  console.log(line(`  Automations: ${chalk.cyan("openokapi automations")}`));
  console.log(line(`  Hooks: ${chalk.cyan("openokapi hooks")}`));
  console.log(line(`  Heartbeat: ${chalk.cyan("openokapi heartbeat")}`));
  console.log(
    line(`  Standing Orders: ${chalk.cyan("openokapi standing-orders")}`),
  );
  console.log(line(`  Scheduler: ${chalk.cyan("openokapi scheduler")}`));
  console.log(line(`  Task Flow: ${chalk.cyan("openokapi task-flow")}`));
  console.log(line(`  Tasks: ${chalk.cyan("openokapi tasks list")}`));
  console.log(line(`  Doctor: ${chalk.cyan("openokapi doctor")}`));
  console.log(line(`  Backup: ${chalk.cyan("openokapi backup")}`));
  console.log(
    line(`  Reset: ${chalk.cyan("openokapi reset --scope config --dry-run")}`),
  );
  console.log(line(`  Security: ${chalk.cyan("openokapi security --json")}`));
  console.log(
    line(`  Status: ${chalk.cyan("openokapi status --deep --json")}`),
  );
  console.log(
    line(`  Alerts: ${chalk.cyan("openokapi alerts --limit 20 --json")}`),
  );
  console.log(
    line(
      `  Incidents: ${chalk.cyan("openokapi incidents create --deep --json")}`,
    ),
  );
  console.log(
    line(
      `  Maintenance: ${chalk.cyan('openokapi maintenance-windows --set --name "Deploy" --start-at <ISO> --end-at <ISO>')}`,
    ),
  );
  console.log(
    line(
      `  Escalations: ${chalk.cyan('openokapi escalations --set --name "Critical errors" --trigger alerts.error --min-severity error --min-count 2')}`,
    ),
  );
  console.log(line(`  Self Test: ${chalk.cyan("openokapi self-test")}`));
  console.log(line(`  History: ${chalk.cyan("openokapi history")}`));
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
