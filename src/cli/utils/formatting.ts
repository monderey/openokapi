import chalk from "chalk";
import { line, width } from "../../utils/cliTypes.js";

export const formatting = {
  bold: (text: string) => chalk.bold(text),
  dim: (text: string) => chalk.dim(text),
  cyan: (text: string) => chalk.cyan(text),
  green: (text: string) => chalk.green(text),
  red: (text: string) => chalk.red(text),
  yellow: (text: string) => chalk.yellow(text),
  blue: (text: string) => chalk.blue(text),
  magenta: (text: string) => chalk.magenta(text),
  highlight: (text: string) => chalk.bold.cyan(text),
  code: (text: string) => chalk.bgGray.white(` ${text} `),
};

export function printWrappedMessage(message: string, indent: number = 2): void {
  const maxWidth = width - 6;
  const indentStr = " ".repeat(indent);

  if (message.length > maxWidth) {
    const words = message.split(" ");
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > maxWidth) {
        console.log(
          line(
            `${chalk.reset("")}${indentStr}${currentLine.trim()}${chalk.reset("")}`,
          ),
        );
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });

    if (currentLine.trim()) {
      console.log(
        line(
          `${chalk.reset("")}${indentStr}${currentLine.trim()}${chalk.reset("")}`,
        ),
      );
    }
  } else {
    console.log(
      line(`${chalk.reset("")}${indentStr}${message}${chalk.reset("")}`),
    );
  }
}

export function printWrappedLines(lines: string[], indent: number = 2): void {
  lines.forEach((l) => {
    if (l.length > width - 6) {
      const words = l.split(" ");
      let currentLine = "";
      const indentStr = " ".repeat(indent);

      words.forEach((word) => {
        if ((currentLine + word).length > width - 6) {
          console.log(
            line(
              `${chalk.reset("")}${indentStr}${currentLine.trim()}${chalk.reset("")}`,
            ),
          );
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });

      if (currentLine.trim()) {
        console.log(
          line(
            `${chalk.reset("")}${indentStr}${currentLine.trim()}${chalk.reset("")}`,
          ),
        );
      }
    } else {
      console.log(
        line(`${chalk.reset("")}${" ".repeat(indent)}${l}${chalk.reset("")}`),
      );
    }
  });
}
