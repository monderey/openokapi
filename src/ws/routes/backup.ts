import { Router } from "express";
import type { Request, Response } from "express";
import {
  createBackupSnapshot,
  listBackupSnapshots,
  verifyBackupSnapshot,
} from "../../functions/backup.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : 20;

  res.json({ backups: listBackupSnapshots(limit) });
});

router.post("/create", (_req: Request, res: Response) => {
  const backup = createBackupSnapshot();
  res.json({ backup });
});

router.get("/:id/verify", (req: Request, res: Response) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!id) {
    res.status(400).json({ error: "Missing backup id" });
    return;
  }

  try {
    const result = verifyBackupSnapshot(id);
    res.status(result.ok ? 200 : 409).json({ result });
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
