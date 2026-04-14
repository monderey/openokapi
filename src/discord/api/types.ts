export type GatewayPayload = {
  op: number;
  d?: unknown;
  s?: number | null;
  t?: string | null;
};

export type GatewayHello = {
  heartbeat_interval: number;
};

export type GatewayReady = {
  session_id: string;
  user: { id: string; username: string; discriminator?: string };
};

export type GatewayInteraction = {
  id: string;
  token: string;
  application_id: string;
  data: {
    name: string;
    options?: Array<{ name: string; value?: string }>;
  };
  member?: {
    user?: { username: string; discriminator?: string };
    permissions?: string;
  };
  user?: { username: string; discriminator?: string };
};
