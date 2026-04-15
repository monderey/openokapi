import { Router } from "express";
import type { Request, Response } from "express";
import {
  deletePricingRule,
  loadPricingConfig,
  upsertPricingRule,
  type PricingProvider,
} from "../../config/pricing.js";

const router: Router = Router();

function parseProvider(value: unknown): PricingProvider | undefined {
  if (value === "openai" || value === "claude" || value === "ollama") {
    return value;
  }
  return undefined;
}

router.get("/", (req: Request, res: Response) => {
  const provider = parseProvider(req.query.provider);
  const config = loadPricingConfig();
  res.json({
    updatedAt: config.updatedAt,
    rules: provider
      ? config.rules.filter((rule) => rule.provider === provider)
      : config.rules,
  });
});

router.post("/rule", (req: Request, res: Response) => {
  const provider = parseProvider(req.body?.provider);
  const match =
    typeof req.body?.match === "string" ? req.body.match.trim() : "";
  const inputPer1kUsd =
    typeof req.body?.inputPer1kUsd === "number" ? req.body.inputPer1kUsd : NaN;
  const outputPer1kUsd =
    typeof req.body?.outputPer1kUsd === "number"
      ? req.body.outputPer1kUsd
      : NaN;

  if (
    !provider ||
    !match ||
    !Number.isFinite(inputPer1kUsd) ||
    !Number.isFinite(outputPer1kUsd)
  ) {
    res.status(400).json({
      error:
        "Required: provider, match, inputPer1kUsd, outputPer1kUsd (numbers)",
    });
    return;
  }

  const config = upsertPricingRule({
    provider,
    match,
    inputPer1kUsd,
    outputPer1kUsd,
  });

  res.json({ config });
});

router.delete("/rule", (req: Request, res: Response) => {
  const provider = parseProvider(req.query.provider);
  const match =
    typeof req.query.match === "string" ? req.query.match.trim() : "";
  if (!provider || !match) {
    res.status(400).json({ error: "Required: provider and match" });
    return;
  }

  const config = deletePricingRule(provider, match);
  res.json({ config });
});

export default router;
