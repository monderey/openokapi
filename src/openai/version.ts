import { getVersion } from "../version.js";

export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_API_VERSION = "v1";

export type OpenAIVersionInfo = {
  packageVersion: string;
  apiBaseUrl: string;
  apiVersion: string;
};

export async function getOpenAIVersionInfo(): Promise<OpenAIVersionInfo> {
  const packageVersion = await getVersion();

  return {
    packageVersion,
    apiBaseUrl: OPENAI_DEFAULT_BASE_URL,
    apiVersion: OPENAI_API_VERSION,
  };
}
