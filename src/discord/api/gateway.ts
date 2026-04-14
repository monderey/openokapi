import os from "node:os";
import WebSocket from "ws";
import type {
  GatewayHello,
  GatewayPayload,
  GatewayReady,
  GatewayInteraction,
} from "./types.js";
import { discordRequest } from "./rest.js";

export type GatewayHandlers = {
  onReady: (ready: GatewayReady) => void;
  onInteraction: (interaction: GatewayInteraction) => Promise<void>;
  onClose?: () => void;
  onError?: (error: unknown) => void;
};

function sendGatewayPayload(socket: WebSocket, payload: GatewayPayload): void {
  socket.send(JSON.stringify(payload));
}

function identify(socket: WebSocket, token: string): void {
  sendGatewayPayload(socket, {
    op: 2,
    d: {
      token,
      intents: 1 << 0,
      properties: {
        os: os.platform(),
        browser: "openokapi",
        device: "openokapi",
      },
    },
  });
}

export function updatePresence(
  socket: WebSocket,
  text: string | null | undefined,
): void {
  const activities =
    text && text.trim().length > 0 ? [{ name: text.trim(), type: 0 }] : [];

  sendGatewayPayload(socket, {
    op: 3,
    d: {
      since: null,
      activities,
      status: "online",
      afk: false,
    },
  });
}

export async function connectGateway(
  token: string,
  handlers: GatewayHandlers,
): Promise<WebSocket> {
  const gateway = await discordRequest<{ url: string }>(
    "GET",
    "/gateway/bot",
    token,
  );
  const socket = new WebSocket(`${gateway.url}?v=10&encoding=json`);
  let lastSequence: number | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const startHeartbeat = (interval: number) => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(() => {
      sendGatewayPayload(socket, { op: 1, d: lastSequence });
    }, interval);
  };

  socket.on("message", async (data) => {
    const payload = JSON.parse(data.toString()) as GatewayPayload;
    if (typeof payload.s === "number") {
      lastSequence = payload.s;
    }

    if (payload.op === 10) {
      const hello = payload.d as GatewayHello;
      startHeartbeat(hello.heartbeat_interval);
      identify(socket, token);
      return;
    }

    if (payload.t === "READY") {
      handlers.onReady(payload.d as GatewayReady);
      return;
    }

    if (payload.t === "INTERACTION_CREATE") {
      await handlers.onInteraction(payload.d as GatewayInteraction);
    }
  });

  socket.on("close", () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    handlers.onClose?.();
  });

  socket.on("error", (error) => {
    handlers.onError?.(error);
  });

  return socket;
}
