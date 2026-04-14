import { getVersion } from "../version.js";

export const CLAUDE_DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
export const CLAUDE_API_VERSION = "2023-06-01";

export type ClaudeVersionInfo = {
  packageVersion: string;
  apiBaseUrl: string;
  apiVersion: string;
};

export async function getClaudeVersionInfo(): Promise<ClaudeVersionInfo> {
  const packageVersion = await getVersion();

  return {
    packageVersion,
    apiBaseUrl: CLAUDE_DEFAULT_BASE_URL,
    apiVersion: CLAUDE_API_VERSION,
  };
}
