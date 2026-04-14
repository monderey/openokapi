import express from "express";
import type { Express } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { validateApiKey, validateUserAgent } from "./middleware.js";
import claudeRouter from "./routes/claude.js";
import openaiRouter from "./routes/openai.js";
import ollamaRouter from "./routes/ollama.js";

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

    this.app.use("/api/claude", claudeRouter);
    this.app.use("/api/openai", openaiRouter);
    this.app.use("/api/ollama", ollamaRouter);

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
      const userAgent = req.headers["user-agent"];

      if (userAgent !== "OPENOKAPI/1.0") {
        ws.send(
          JSON.stringify({
            error: "Invalid User-Agent. Required: OPENOKAPI/1.0",
          }),
        );
        ws.close();
        return;
      }

      console.log("WebSocket client connected");

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          console.log("Received:", data);

          ws.send(
            JSON.stringify({
              status: "received",
              data,
            }),
          );
        } catch (error) {
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
