import express from "express";
import type { Express } from "express";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { Server } from "http";
import {
  getGatewayAuthConfig,
  getHeaderValue,
  validateApiKey,
  validateGatewayRateLimit,
  validateUserAgent,
} from "./middleware.js";
import claudeRouter from "./routes/claude.js";
import batchRouter from "./routes/batch.js";
import historyRouter from "./routes/history.js";
import profilesRouter from "./routes/profiles.js";
import cacheRouter from "./routes/cache.js";
import costsRouter from "./routes/costs.js";
import chatRouter from "./routes/chat.js";
import pricingRouter from "./routes/pricing.js";
import capabilitiesRouter from "./routes/capabilities.js";
import integrationsRouter from "./routes/integrations.js";
import routerControlRouter from "./routes/router.js";
import guardrailsRouter from "./routes/guardrails.js";
import evalsRouter from "./routes/evals.js";
import budgetRouter from "./routes/budget.js";
import automationsRouter from "./routes/automations.js";
import schedulerRouter from "./routes/scheduler.js";
import systemRouter from "./routes/system.js";
import hooksRouter from "./routes/hooks.js";
import heartbeatRouter from "./routes/heartbeat.js";
import standingOrdersRouter from "./routes/standing-orders.js";
import taskFlowRouter from "./routes/task-flow.js";
import tasksRouter from "./routes/tasks.js";
import doctorRouter from "./routes/doctor.js";
import openaiRouter from "./routes/openai.js";
import ollamaRouter from "./routes/ollama.js";
import panelRouter from "./routes/panel-router.js";
import backupRouter from "./routes/backup.js";
import resetRouter from "./routes/reset.js";
import securityRouter from "./routes/security.js";
import statusRouter from "./routes/status.js";
import alertsRouter from "./routes/alerts.js";
import incidentsRouter from "./routes/incidents.js";
import maintenanceWindowsRouter from "./routes/maintenance-windows.js";
import escalationsRouter from "./routes/escalations.js";
import {
  startSchedulerEngine,
  stopSchedulerEngine,
} from "../functions/scheduler-engine.js";
import {
  startHeartbeatEngine,
  stopHeartbeatEngine,
} from "../functions/heartbeat-engine.js";
import {
  startTaskLedgerMaintenanceSweeper,
  stopTaskLedgerMaintenanceSweeper,
} from "../functions/tasks-ledger.js";
import {
  startTaskFlowMaintenanceSweeper,
  stopTaskFlowMaintenanceSweeper,
} from "../functions/task-flow.js";

export interface ServerConfig {
  port: number;
}

export class GatewayServer {
  private app: Express;
  private server: Server | null = null;
  private wss: WebSocketServer | null = null;
  private port: number;

  constructor(config: ServerConfig) {
    this.port = config.port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(
      express.json({
        limit: "1mb",
        strict: true,
      }),
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "256kb",
        parameterLimit: 100,
      }),
    );

    this.app.use((req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
      );
      next();
    });

    this.app.use("/api", validateUserAgent);
    this.app.use("/api", validateApiKey);
    this.app.use("/api", validateGatewayRateLimit);
  }

  private setupRoutes(): void {
    this.app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    this.app.use("/panel", panelRouter);
    this.app.get("/", (req, res) => {
      res.redirect("/panel");
    });

    this.app.use("/api/claude", claudeRouter);
    this.app.use("/api/openai", openaiRouter);
    this.app.use("/api/ollama", ollamaRouter);
    this.app.use("/api/batch", batchRouter);
    this.app.use("/api/history", historyRouter);
    this.app.use("/api/profiles", profilesRouter);
    this.app.use("/api/cache", cacheRouter);
    this.app.use("/api/costs", costsRouter);
    this.app.use("/api/chat", chatRouter);
    this.app.use("/api/pricing", pricingRouter);
    this.app.use("/api/capabilities", capabilitiesRouter);
    this.app.use("/api/integrations", integrationsRouter);
    this.app.use("/api/router", routerControlRouter);
    this.app.use("/api/guardrails", guardrailsRouter);
    this.app.use("/api/evals", evalsRouter);
    this.app.use("/api/budget", budgetRouter);
    this.app.use("/api/automations", automationsRouter);
    this.app.use("/api/hooks", hooksRouter);
    this.app.use("/api/heartbeat", heartbeatRouter);
    this.app.use("/api/standing-orders", standingOrdersRouter);
    this.app.use("/api/scheduler", schedulerRouter);
    this.app.use("/api/task-flow", taskFlowRouter);
    this.app.use("/api/tasks", tasksRouter);
    this.app.use("/api/doctor", doctorRouter);
    this.app.use("/api/backup", backupRouter);
    this.app.use("/api/reset", resetRouter);
    this.app.use("/api/security", securityRouter);
    this.app.use("/api/status", statusRouter);
    this.app.use("/api/alerts", alertsRouter);
    this.app.use("/api/incidents", incidentsRouter);
    this.app.use("/api/maintenance-windows", maintenanceWindowsRouter);
    this.app.use("/api/escalations", escalationsRouter);
    this.app.use("/api/system", systemRouter);

    this.app.use((req, res) => {
      res.status(404).json({
        error: "Not found",
        path: req.path,
      });
    });
  }

  private setupWebSocket(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({
      server: this.server,
      maxPayload: 16_384,
    });

    const isOriginAllowed = (originValue: string | undefined): boolean => {
      if (!originValue) {
        return true;
      }

      let origin: URL;
      try {
        origin = new URL(originValue);
      } catch {
        return false;
      }

      const configured = (process.env.OPENOKAPI_ALLOWED_ORIGINS || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (configured.length > 0) {
        return configured.includes(origin.origin);
      }

      return (
        origin.hostname === "localhost" ||
        origin.hostname === "127.0.0.1" ||
        origin.hostname === "::1"
      );
    };

    this.wss.on("connection", (ws: WebSocket, req) => {
      const authConfig = getGatewayAuthConfig();
      const userAgent = getHeaderValue(req.headers["user-agent"]);
      const apiKey = getHeaderValue(req.headers["x-api-key"]);
      const origin = getHeaderValue(req.headers.origin);

      if (!isOriginAllowed(origin)) {
        ws.send(
          JSON.stringify({
            error: "Invalid Origin.",
          }),
        );
        ws.close(1008, "Invalid Origin");
        return;
      }

      if (!authConfig.apiKey) {
        ws.send(
          JSON.stringify({
            error:
              "API key not configured on server. Use 'openokapi generate api-key' first.",
          }),
        );
        ws.close(1011, "API key not configured");
        return;
      }

      if (userAgent !== authConfig.userAgent) {
        ws.send(
          JSON.stringify({
            error: "Invalid User-Agent.",
          }),
        );
        ws.close(1008, "Invalid User-Agent");
        return;
      }

      if (apiKey !== authConfig.apiKey) {
        ws.send(
          JSON.stringify({
            error: "Invalid or missing API key",
          }),
        );
        ws.close(1008, "Invalid API key");
        return;
      }

      console.log("WebSocket client connected");

      ws.on("message", (message: RawData) => {
        const payload = message.toString();

        if (payload.length > 16_384) {
          ws.send(
            JSON.stringify({
              error: "Message too large",
            }),
          );
          ws.close(1009, "Message too large");
          return;
        }

        try {
          const data = JSON.parse(payload);
          console.log("Received:", data);

          ws.send(
            JSON.stringify({
              status: "received",
              data,
            }),
          );
        } catch {
          ws.send(
            JSON.stringify({
              error: "Invalid JSON",
            }),
          );
        }
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
      });

      ws.send(
        JSON.stringify({
          status: "connected",
          message: "Welcome to OpenOKAPI Gateway",
        }),
      );
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          this.setupWebSocket();
          startSchedulerEngine();
          startHeartbeatEngine();
          startTaskLedgerMaintenanceSweeper();
          startTaskFlowMaintenanceSweeper();
          resolve();
        });

        this.server.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      stopSchedulerEngine();
      stopHeartbeatEngine();
      stopTaskLedgerMaintenanceSweeper();
      stopTaskFlowMaintenanceSweeper();

      if (this.wss) {
        this.wss.close();
      }

      if (this.server) {
        this.server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
