import axios from "axios";

export type DiscordTokenVerificationResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "network" };

export async function cliVerifyToken(
  token: string,
): Promise<DiscordTokenVerificationResult> {
  try {
    await axios.get("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });
    return { ok: true };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return { ok: false, reason: "invalid" };
    }
    return { ok: false, reason: "network" };
  }
}
