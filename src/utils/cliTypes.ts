import chalk from "chalk";

export const width = 60;

export const line = (content: string): string => {
  const plain = content.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = Math.max(0, width - 2 - plain.length);
  return `${chalk.dim("│")}${content}${" ".repeat(padding)}${chalk.dim("│")}`;
};
