import { Router } from "express";
import type { Request, Response } from "express";
import { runReset, type ResetScope } from "../../functions/reset.js";

const router: Router = Router();

function parseScope(value: unknown): ResetScope | undefined {
  return value === "config" || value === "config+history" || value === "full"
    ? value
    : undefined;
}

router.get("/plan", (req: Request, res: Response) => {
  const scope = parseScope(req.query.scope);
  if (!scope) {
    res
      .status(400)
      .json({ error: "Invalid scope. Use config, config+history, or full" });
    return;
  }

  const result = runReset({ scope, dryRun: true });
  res.json({ result });
});

router.post("/run", (req: Request, res: Response) => {
  const body = req.body as { scope?: unknown; dryRun?: unknown };
  const scope = parseScope(body.scope);
  if (!scope) {
    res
      .status(400)
      .json({ error: "Invalid scope. Use config, config+history, or full" });
    return;
  }

  const dryRun = body.dryRun === true;
  const result = runReset({ scope, dryRun });
  res.json({ result });
});

export default router;
