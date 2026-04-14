import { Router } from "express";
import type { Request, Response } from "express";
import {
  executeWithFailover,
  type Provider,
} from "../../functions/failover.js";

const router: Router = Router();

const MAX_REQUESTS = 50;

type BatchRequestItem = {
  provider: Provider;
  prompt: string;
  model?: string;
};

function isProvider(value: unknown): value is Provider {
  return value === "openai" || value === "claude" || value === "ollama";
}

function isBatchItem(value: unknown): value is BatchRequestItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as BatchRequestItem;
  return (
    isProvider(item.provider) &&
    typeof item.prompt === "string" &&
    item.prompt.trim().length > 0 &&
    item.prompt.length <= 20_000 &&
    (item.model === undefined ||
      (typeof item.model === "string" && item.model.length <= 256))
  );
}

async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const safeConcurrency = Math.max(1, Math.min(concurrency, 10));
  const results: R[] = new Array(items.length);
  let index = 0;

  async function runWorker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const currentItem = items[currentIndex];
      if (currentItem === undefined) {
        break;
      }
      results[currentIndex] = await worker(currentItem, currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(safeConcurrency, items.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

router.post("/", async (req: Request, res: Response) => {
  const { requests, concurrency } = req.body as {
    requests?: unknown;
    concurrency?: unknown;
  };

  if (!Array.isArray(requests) || requests.length === 0) {
    res.status(400).json({
      error: "Missing required field: requests",
    });
    return;
  }

  if (requests.length > MAX_REQUESTS) {
    res.status(400).json({
      error: `Too many requests in one batch. Max: ${MAX_REQUESTS}`,
    });
    return;
  }

  if (!requests.every(isBatchItem)) {
    res.status(400).json({
      error: "One or more batch items are invalid",
    });
    return;
  }

  const batchConcurrency =
    typeof concurrency === "number" && Number.isFinite(concurrency)
      ? Math.floor(concurrency)
      : 3;

  const startedAt = Date.now();
  const results = await processWithConcurrency(
    requests,
    batchConcurrency,
    async (item, index) => {
      const result = await executeWithFailover(
        item.model === undefined
          ? {
              provider: item.provider,
              prompt: item.prompt,
              historySource: "gateway",
              historyAction: "ask",
            }
          : {
              provider: item.provider,
              prompt: item.prompt,
              model: item.model,
              historySource: "gateway",
              historyAction: "ask",
            },
      );

      return {
        index,
        provider: item.provider,
        model: item.model,
        ...result,
      };
    },
  );

  res.json({
    success: true,
    total: results.length,
    completedInMs: Date.now() - startedAt,
    results,
  });
});

export default router;
