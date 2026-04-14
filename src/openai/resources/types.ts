export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  functions?: Array<{
    name: string;
    description?: string;
    parameters?: {
      type: "object";
      properties?: Record<string, any>;
      required?: string[];
    };
  }>;
  function_call?: "auto" | "none" | { name: string };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: ChatCompletionMessage;
    finish_reason: "stop" | "length" | "function_call" | null;
    delta?: Partial<ChatCompletionMessage>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  user?: string;
}

export interface EmbeddingResponse {
  object: string;
  model: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface CompletionRequest {
  model: string;
  prompt: string | string[];
  suffix?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  logprobs?: number | null;
  echo?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logprobs: any | null;
    finish_reason: "stop" | "length" | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: string;
  owned_by: string;
  created?: number;
  permission?: Array<{
    id: string;
    object: string;
    created: number;
    allow_create_engine: boolean;
    allow_fine_tuning: boolean;
    allow_logprobs: boolean;
    allow_sampling: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    is_blocking: boolean;
  }>;
  root?: string;
  parent?: string | null;
}

export interface ModelsListResponse {
  object: string;
  data: ModelInfo[];
}

export interface TokenUsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export type StreamCallback = (
  chunk: ChatCompletionResponse,
) => void | Promise<void>;
export type ErrorCallback = (error: Error) => void;
export type CompleteCallback = () => void;
