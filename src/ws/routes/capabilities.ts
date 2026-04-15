import { Router } from "express";
import type { Request, Response } from "express";
import {
  CAPABILITY_KEYS,
  loadCapabilitiesConfig,
  setCapability,
  type CapabilityKey,
} from "../../config/capabilities.js";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json(loadCapabilitiesConfig());
});

router.post("/:key", (req: Request, res: Response) => {
  const key = req.params.key;
  if (!CAPABILITY_KEYS.includes(key as CapabilityKey)) {
    res.status(400).json({ error: "Unknown capability key" });
    return;
  }

  const enabled = req.body?.enabled !== false;
  const updated = setCapability(key as CapabilityKey, enabled);
  res.json(updated);
});

export default router;
