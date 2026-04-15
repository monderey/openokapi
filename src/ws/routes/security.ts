import { Router } from "express";
import type { Request, Response } from "express";
import { runSecurityAudit } from "../../functions/security-audit.js";

const router: Router = Router();

router.get("/audit", (req: Request, res: Response) => {
  const fix = req.query.fix === "1" || req.query.fix === "true";
  const report = runSecurityAudit({ fix });
  res.status(report.ok ? 200 : 500).json({ report });
});

router.post("/audit", (req: Request, res: Response) => {
  const body = req.body as { fix?: unknown };
  const report = runSecurityAudit({ fix: body?.fix === true });
  res.status(report.ok ? 200 : 500).json({ report });
});

export default router;
