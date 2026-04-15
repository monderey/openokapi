import { Router } from "express";
import type { Request, Response } from "express";
import {
  acknowledgeIncident,
  createIncident,
  getIncident,
  listIncidents,
  resolveIncident,
  type IncidentStatus,
} from "../../functions/incidents.js";

const router: Router = Router();

function parseStatus(value: unknown): IncidentStatus | undefined {
  return value === "open" || value === "acknowledged" || value === "resolved"
    ? value
    : undefined;
}

router.get("/", (req: Request, res: Response) => {
  const status = parseStatus(req.query.status);
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : undefined;

  res.json({ incidents: listIncidents({ status, limit } as any) });
});

router.post("/", (req: Request, res: Response) => {
  try {
    const incident = createIncident({
      title: typeof req.body?.title === "string" ? req.body.title : undefined,
      deep: req.body?.deep === true,
      alertLimit:
        typeof req.body?.alertLimit === "number"
          ? req.body.alertLimit
          : undefined,
      forceWhenMuted: req.body?.forceWhenMuted === true,
    });

    res.status(201).json({ incident });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  const incidentId = Array.isArray(req.params.id)
    ? req.params.id[0] || ""
    : req.params.id || "";
  const incident = getIncident(incidentId);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json({ incident });
});

router.post("/:id/ack", (req: Request, res: Response) => {
  const incidentId = Array.isArray(req.params.id)
    ? req.params.id[0] || ""
    : req.params.id || "";
  const incident = acknowledgeIncident(
    incidentId,
    typeof req.body?.note === "string" ? req.body.note : undefined,
  );
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json({ incident });
});

router.post("/:id/resolve", (req: Request, res: Response) => {
  const incidentId = Array.isArray(req.params.id)
    ? req.params.id[0] || ""
    : req.params.id || "";
  const incident = resolveIncident(
    incidentId,
    typeof req.body?.note === "string" ? req.body.note : undefined,
  );
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json({ incident });
});

export default router;
