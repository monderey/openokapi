import { Router } from "express";
import type { Request, Response } from "express";
import { evaluateResponse } from "../../functions/evals.js";

const router: Router = Router();

router.post("/score", (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  const responseText =
    typeof req.body?.response === "string" ? req.body.response : "";

  if (!prompt.trim() || !responseText.trim()) {
    res.status(400).json({ error: "Required: prompt and response" });
    return;
  }

  res.json({ report: evaluateResponse({ prompt, response: responseText }) });
});

export default router;
