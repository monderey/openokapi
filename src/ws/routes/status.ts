import { Router } from "express";
import type { Request, Response } from "express";
import { getStatusReport } from "../../functions/status.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const deep = req.query.deep === "1" || req.query.deep === "true";
  const report = getStatusReport({ deep });
  res.status(report.ok ? 200 : 500).json({ report });
});

export default router;
