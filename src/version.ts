import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const packageJsonPath = path.join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

async function getVersionFromGitHub(): Promise<string | null> {
  try {
    const response = await axios.get<{ tag_name?: string }>(
      "https://api.github.com/repos/monderey/openokapi/releases/latest",
    );
    return response.data.tag_name
      ? response.data.tag_name.replace("v", "")
      : null;
  } catch {
    return null;
  }
}

async function resolveLatestVersion(): Promise<string> {
  if (packageJson.version) {
    return packageJson.version;
  }

  const githubVersion = await getVersionFromGitHub();
  if (githubVersion) {
    return githubVersion;
  }

  return "0.0.0";
}

export async function getVersion(): Promise<string> {
  return resolveLatestVersion();
}
