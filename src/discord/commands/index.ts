import type { SlashCommand } from "./command.js";
import { command as status } from "./status.js";
import { command as usage } from "./usage.js";
import { command as restart } from "./restart.js";
import { command as newCommand } from "./new.js";
import { command as version } from "./version.js";
import { command as ask } from "./ask.js";

export const commands: SlashCommand[] = [
  status,
  newCommand,
  usage,
  restart,
  version,
  ask,
];
