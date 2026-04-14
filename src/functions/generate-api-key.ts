import { randomUUID } from "node:crypto";

export function generateApiKey(): string {
  return randomUUID();
}
