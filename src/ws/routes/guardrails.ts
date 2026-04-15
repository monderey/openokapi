import { Router } from "express";
import type { Request, Response } from "express";
import {
  loadGuardrailsConfig,
  updateGuardrailsConfig,
} from "../../config/guardrails.js";
import { sanitizeText } from "../../functions/guardrails.js";

const router: Router = Router();

router.get("/config", (req: Request, res: Response) => {
  res.json({ config: loadGuardrailsConfig() });
});

router.post("/config", (req: Request, res: Response) => {
  const updated = updateGuardrailsConfig({
    enabled:
      typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined,
    blockedTerms: Array.isArray(req.body?.blockedTerms)
      ? req.body.blockedTerms
      : undefined,
    redactPatterns: Array.isArray(req.body?.redactPatterns)
      ? req.body.redactPatterns
      : undefined,
    replacement:
      typeof req.body?.replacement === "string"
        ? req.body.replacement
        : undefined,
  });
  res.json({ config: updated });
});

router.post("/scan", (req: Request, res: Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  res.json(sanitizeText(text));
});

export default router;
