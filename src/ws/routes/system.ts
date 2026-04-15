import { Router } from "express";
import type { Request, Response } from "express";
import { runSystemSelfTest } from "../../functions/self-test.js";

const router: Router = Router();

router.get("/self-test", (req: Request, res: Response) => {
  const report = runSystemSelfTest();
  res.status(report.ok ? 200 : 500).json({ report });
});

export default router;
