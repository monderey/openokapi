import { Router } from "express";
import type { Request, Response } from "express";
import { getAlertsReport } from "../../functions/alerts.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const deep = req.query.deep === "1" || req.query.deep === "true";
  const ignoreMute =
    req.query.ignoreMute === "1" || req.query.ignoreMute === "true";
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : undefined;

  const report = getAlertsReport({ deep, limit, ignoreMute } as any);
  res.status(report.ok ? 200 : 500).json({ report });
});

export default router;
