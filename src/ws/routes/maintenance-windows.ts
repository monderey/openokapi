import { Router } from "express";
import type { Request, Response } from "express";
import {
  deleteMaintenanceWindow,
  getMaintenanceStatus,
  listMaintenanceWindows,
  upsertMaintenanceWindow,
} from "../../functions/maintenance-windows.js";

const router: Router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    windows: listMaintenanceWindows(),
    status: getMaintenanceStatus(),
  });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const window = upsertMaintenanceWindow({
      id: typeof req.body?.id === "string" ? req.body.id : undefined,
      name: typeof req.body?.name === "string" ? req.body.name : "",
      enabled:
        typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined,
      startAt: typeof req.body?.startAt === "string" ? req.body.startAt : "",
      endAt: typeof req.body?.endAt === "string" ? req.body.endAt : "",
      muteAlerts:
        typeof req.body?.muteAlerts === "boolean"
          ? req.body.muteAlerts
          : undefined,
      muteIncidents:
        typeof req.body?.muteIncidents === "boolean"
          ? req.body.muteIncidents
          : undefined,
    });

    res.json({ window });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0] || ""
    : req.params.id || "";
  const deleted = deleteMaintenanceWindow(id);
  if (!deleted) {
    res.status(404).json({ error: "Maintenance window not found" });
    return;
  }

  res.json({ success: true });
});

router.get("/status", (_req: Request, res: Response) => {
  res.json({ status: getMaintenanceStatus() });
});

export default router;
