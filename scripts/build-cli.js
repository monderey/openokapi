import chalk from "chalk";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.join(__dirname, "..");

const distDir = path.join(rootDir, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

esbuild
  .build({
    entryPoints: [path.join(rootDir, "src/cli/index.ts")],
    outfile: path.join(distDir, "cli/index.cjs"),
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    external: ["chalk", "axios", "ws", "express", "dotenv", "zod"],
    sourcemap: false,
  })
  .then(() => {
    const pkgSource = path.join(rootDir, "package.json");
    const pkgDest = path.join(distDir, "package.json");
    fs.copyFileSync(pkgSource, pkgDest);
    console.log(
      `${chalk.green("✓")} CLI built successfully to CommonJS at ${pkgDest}`,
    );
  })
  .catch((error) => {
    console.error("✗ Build failed:", error);
    process.exit(1);
  });
