import { Router } from "express";
import type { Request, Response } from "express";
import { runDoctor } from "../../functions/doctor.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const repair = req.query.repair === "1" || req.query.repair === "true";
  const retentionDays =
    typeof req.query.retentionDays === "string"
      ? Number.parseInt(req.query.retentionDays, 10)
      : undefined;

  const report = runDoctor({ repair, retentionDays } as any);
  res.status(report.ok ? 200 : 500).json({ report });
});

router.post("/repair", (req: Request, res: Response) => {
  const body = req.body as { retentionDays?: number };
  const report = runDoctor(
    {
      repair: true,
      retentionDays:
        typeof body?.retentionDays === "number"
          ? body.retentionDays
          : undefined,
    } as any,
  );

  res.status(report.ok ? 200 : 500).json({ report });
});

export default router;
