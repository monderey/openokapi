import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteProfile,
  getProfile,
  listProfiles,
  upsertProfile,
} from "../../config/profiles.js";
import { runProfile } from "../../functions/profile-runner.js";

const router: Router = Router();

function getParamId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function getText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

router.get("/", (req: Request, res: Response) => {
  res.json({ profiles: listProfiles() });
});

router.get("/:name", (req: Request, res: Response) => {
  const name = getParamId(req.params.name);
  if (!name) {
    res.status(400).json({ error: "Missing profile name" });
    return;
  }

  const profile = getProfile(name);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ profile });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const input: {
      name: string;
      provider: "openai" | "claude" | "ollama";
      template: string;
      description?: string;
      model?: string;
      system?: string;
      temperature?: number;
      maxTokens?: number;
    } = {
      name: getText(req.body?.name) || "",
      provider: req.body?.provider,
      template: getText(req.body?.template) || "",
    };

    const description = getText(req.body?.description);
    const model = getText(req.body?.model);
    const system = getText(req.body?.system);
    const temperature = getNumber(req.body?.temperature);
    const maxTokens = getNumber(req.body?.maxTokens);
    if (description) input.description = description;
    if (model) input.model = model;
    if (system) input.system = system;
    if (typeof temperature === "number") input.temperature = temperature;
    if (typeof maxTokens === "number") input.maxTokens = maxTokens;

    const profile = upsertProfile(input);

    res.json({ profile });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to save profile",
    });
  }
});

router.post("/:name/run", async (req: Request, res: Response) => {
  try {
    const name = getParamId(req.params.name);
    if (!name) {
      res.status(400).json({ error: "Missing profile name" });
      return;
    }

    const input = getText(req.body?.input) || getText(req.body?.prompt);

    if (!input) {
      res.status(400).json({ error: "Missing required field: input" });
      return;
    }

    const variables =
      req.body?.variables && typeof req.body.variables === "object"
        ? Object.fromEntries(
            Object.entries(req.body.variables as Record<string, unknown>).map(
              ([key, value]) => [key, String(value)],
            ),
          )
        : undefined;

    const runInput: {
      input: string;
      variables?: Record<string, string>;
      historySource: "gateway";
    } = {
      input,
      historySource: "gateway",
    };
    if (variables) {
      runInput.variables = variables;
    }

    const profile = await runProfile(name, runInput);

    res.json({
      profile: profile.profile,
      prompt: profile.prompt,
      response: profile.response,
      meta: {
        providerUsed: profile.providerUsed,
        modelUsed: profile.modelUsed,
        fallbackUsed: profile.fallbackUsed,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Profile execution failed";
    const status = message.includes("not found") ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

router.delete("/:name", (req: Request, res: Response) => {
  const name = getParamId(req.params.name);
  if (!name) {
    res.status(400).json({ error: "Missing profile name" });
    return;
  }

  const deleted = deleteProfile(name);

  if (!deleted) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ success: true, message: "Profile deleted" });
});

export default router;
