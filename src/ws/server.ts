import express from "express";
import type { Express } from "express";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { Server } from "http";
import {
  getGatewayAuthConfig,
  getHeaderValue,
  validateApiKey,
  validateUserAgent,
} from "./middleware.js";
import claudeRouter from "./routes/claude.js";
import batchRouter from "./routes/batch.js";
import historyRouter from "./routes/history.js";
import openaiRouter from "./routes/openai.js";
import ollamaRouter from "./routes/ollama.js";
import panelRouter from "./routes/panel-router.js";

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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use("/api", validateUserAgent);
    this.app.use("/api", validateApiKey);
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

    this.app.use((req, res) => {
      res.status(404).json({
        error: "Not found",
        path: req.path,
      });
    });
  }

  private setupWebSocket(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const authConfig = getGatewayAuthConfig();
      const userAgent = getHeaderValue(req.headers["user-agent"]);
      const apiKey = getHeaderValue(req.headers["x-api-key"]);

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
