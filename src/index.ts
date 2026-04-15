export {
  OpenAIClient,
  createOpenAIClient,
  getOpenAIClient,
  openaiClient,
} from "./openai/client.js";
export type {
  OpenAIClientOptions,
  RateLimitConfig as OpenAIRateLimitConfig,
} from "./openai/client.js";
export type {
  ChatCompletionMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  CompletionRequest,
  CompletionResponse,
  ModelInfo,
} from "./openai/resources/types.js";
export { StreamProcessor } from "./openai/streaming/processor.js";
export type { StreamHandler } from "./openai/streaming/processor.js";
export {
  ClaudeClient,
  createClaudeClient,
  getClaudeClient,
  claudeClient,
} from "./claude/client.js";
export type {
  ClaudeClientOptions,
  RateLimitConfig as ClaudeRateLimitConfig,
} from "./claude/client.js";
export type {
  ClaudeMessage,
  ClaudeRequestOptions,
  ClaudeMessageResponse,
  ClaudeModelInfo,
  ClaudeModelsListResponse,
  ClaudeErrorResponse,
  ClaudeErrorCode,
  ClaudeError,
  LogLevel,
  LogEntry,
  ValidationResult,
  RateLimitHeaders,
} from "./claude/models/index.js";
export {
  sendOpenAIRequest,
  streamOpenAIRequest,
  formatErrorForCLI as formatOpenAIErrorForCLI,
} from "./functions/openai-request.js";
export {
  sendClaudeRequest,
  formatClaudeErrorForCLI,
  formatClaudeErrorForDiscord,
} from "./functions/claude-request.js";
export {
  loadOpenAIConfig,
  saveOpenAIConfig,
  updateOpenAIConfig,
  loadOpenAIModels,
  saveOpenAIModels,
} from "./config/openai.js";
export type { OpenAIConfig, OpenAIModel } from "./config/openai.js";
export {
  loadClaudeConfig,
  saveClaudeConfig,
  updateClaudeConfig,
  loadClaudeModels,
  saveClaudeModels,
} from "./config/claude.js";
export type { ClaudeConfig, ClaudeModel } from "./config/claude.js";
export {
  loadDiscordConfig,
  saveDiscordConfig,
  updateDiscordConfig,
} from "./config/discord.js";
export type { DiscordConfig } from "./config/discord.js";
export {
  loadCacheConfig,
  saveCacheConfig,
  updateCacheConfig,
  updateCacheProviderPolicy,
} from "./config/cache.js";
export type {
  CacheConfig,
  CacheProvider,
  CacheProviderPolicy,
} from "./config/cache.js";
export {
  loadPricingConfig,
  savePricingConfig,
  upsertPricingRule,
  deletePricingRule,
} from "./config/pricing.js";
export type {
  PricingConfig,
  PricingProvider,
  PricingRule,
} from "./config/pricing.js";
export {
  loadCapabilitiesConfig,
  saveCapabilitiesConfig,
  setCapability,
  CAPABILITY_KEYS,
} from "./config/capabilities.js";
export type {
  CapabilityKey,
  CapabilitiesConfig,
} from "./config/capabilities.js";
export {
  listIntegrations,
  upsertIntegration,
  deleteIntegration,
} from "./config/integrations.js";
export type {
  IntegrationType,
  IntegrationConfig,
} from "./config/integrations.js";
export {
  loadRouterPolicy,
  saveRouterPolicy,
  updateRouterPolicy,
} from "./config/router-policy.js";
export type { RoutingStrategy, RouterPolicy } from "./config/router-policy.js";
export {
  loadGuardrailsConfig,
  saveGuardrailsConfig,
  updateGuardrailsConfig,
} from "./config/guardrails.js";
export type { GuardrailsConfig } from "./config/guardrails.js";
export {
  loadBudgetConfig,
  saveBudgetConfig,
  updateBudgetConfig,
} from "./config/budget.js";
export type { BudgetConfig } from "./config/budget.js";
export {
  listAutomationRules,
  upsertAutomationRule,
  deleteAutomationRule,
  markAutomationRuleRun,
} from "./config/automations.js";
export type {
  AutomationCondition,
  AutomationAction,
  AutomationRule,
} from "./config/automations.js";
export {
  listHooks,
  getHook,
  upsertHook,
  deleteHook,
  markHookRun,
} from "./config/hooks.js";
export type { HookCondition, HookAction, HookEntry } from "./config/hooks.js";
export {
  listEscalationRules,
  upsertEscalationRule,
  deleteEscalationRule,
  markEscalationRun,
} from "./config/escalations.js";
export type {
  EscalationTrigger,
  EscalationSeverity,
  EscalationRule,
} from "./config/escalations.js";
export {
  listStandingOrders,
  upsertStandingOrder,
  deleteStandingOrder,
} from "./config/standing-orders.js";
export type {
  StandingOrderScope,
  StandingOrder,
} from "./config/standing-orders.js";
export {
  listSchedulerJobs,
  getSchedulerJob,
  upsertSchedulerJob,
  deleteSchedulerJob,
  markSchedulerJobRun,
} from "./config/scheduler.js";
export type { SchedulerTaskType, SchedulerJob } from "./config/scheduler.js";
export {
  listTaskFlows,
  getTaskFlow,
  upsertTaskFlow,
  saveTaskFlow,
  deleteTaskFlow,
} from "./config/task-flow.js";
export type {
  TaskFlowMode,
  TaskFlowStatus,
  TaskFlowStepStatus,
  TaskFlowStep,
  TaskFlow,
  ListTaskFlowsOptions,
  TaskFlowAuditSeverity,
  TaskFlowAuditFindingCode,
  TaskFlowAuditFinding,
  TaskFlowMaintenanceResult,
} from "./config/task-flow.js";
export {
  loadHeartbeatConfig,
  saveHeartbeatConfig,
  updateHeartbeatConfig,
  markHeartbeatRun,
} from "./config/heartbeat.js";
export type { HeartbeatConfig } from "./config/heartbeat.js";
export {
  listTasks,
  getTask,
  createTask,
  updateTask,
  appendTaskLog,
} from "./config/tasks.js";
export type {
  TaskKind,
  TaskStatus,
  TaskNotifyPolicy,
  TaskLogEntry,
  TaskRecord,
  TaskAuditSeverity,
  TaskAuditFindingCode,
  TaskAuditFinding,
  TaskMaintenanceResult,
} from "./config/tasks.js";
export {
  listConversations,
  getConversation,
  createConversation,
  appendConversationMessage,
  deleteConversation,
} from "./config/conversations.js";
export type {
  ConversationProvider,
  ConversationRole,
  ConversationMessage,
  ConversationThread,
} from "./config/conversations.js";
export {
  loadProfiles,
  saveProfiles,
  listProfiles,
  getProfile,
  upsertProfile,
  deleteProfile,
} from "./config/profiles.js";
export type {
  ProfileDefinition,
  ProfileProvider,
  ProfileUpsertInput,
} from "./config/profiles.js";
export { startDiscordBot, startDiscordBotFromConfig } from "./discord/index.js";
export { getVersion } from "./version.js";
export {
  OPENAI_DEFAULT_BASE_URL,
  OPENAI_API_VERSION,
  getOpenAIVersionInfo,
} from "./openai/version.js";
export type { OpenAIVersionInfo } from "./openai/version.js";
export {
  CLAUDE_DEFAULT_BASE_URL,
  CLAUDE_API_VERSION,
  getClaudeVersionInfo,
} from "./claude/version.js";
export type { ClaudeVersionInfo } from "./claude/version.js";
export { OllamaClient } from "./ollama/client.js";
export type { OllamaClientOptions } from "./ollama/client.js";
export type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaModelInfo,
  OllamaPullResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  RateLimitConfig as OllamaRateLimitConfig,
} from "./ollama/models/index.js";
export {
  loadOllamaConfig,
  saveOllamaConfig,
  updateOllamaConfig,
  loadOllamaModels,
  saveOllamaModels,
  findOllamaModel,
  modelExists,
} from "./config/ollama.js";
export type { OllamaConfig, OllamaModel } from "./config/ollama.js";
export {
  sendOllamaRequest,
  formatErrorForCLI as formatOllamaErrorForCLI,
} from "./functions/ollama-request.js";
export { runProfile } from "./functions/profile-runner.js";
export {
  executeWithSmartRouting,
  selectProviderByPolicy,
} from "./functions/smart-router.js";
export { sanitizeText } from "./functions/guardrails.js";
export { evaluateResponse } from "./functions/evals.js";
export { dispatchIntegrationEvent } from "./functions/integrations-dispatch.js";
export { getBudgetStatus } from "./functions/budget-enforcer.js";
export { runAutomationRules } from "./functions/automations.js";
export { runEscalationRules } from "./functions/escalations.js";
export type { EscalationRunResult } from "./functions/escalations.js";
export { runHooksForEvent } from "./functions/hooks.js";
export {
  buildStandingOrdersPrompt,
  applyStandingOrdersToPrompt,
} from "./functions/standing-orders.js";
export { emitPlatformEvent } from "./functions/event-bus.js";
export {
  startSchedulerEngine,
  stopSchedulerEngine,
  reloadSchedulerEngine,
  runSchedulerJobNow,
  getSchedulerEngineStatus,
} from "./functions/scheduler-engine.js";
export { runSystemSelfTest } from "./functions/self-test.js";
export {
  runTaskFlow,
  cancelTaskFlow,
  getTaskFlowStatus,
  runTaskFlowAudit,
  runTaskFlowMaintenance,
  startTaskFlowMaintenanceSweeper,
  stopTaskFlowMaintenanceSweeper,
  getTaskFlowMaintenanceStatus,
} from "./functions/task-flow.js";
export { runDoctor } from "./functions/doctor.js";
export type {
  DoctorSeverity,
  DoctorFinding,
  DoctorReport,
} from "./functions/doctor.js";
export {
  runHeartbeatNow,
  startHeartbeatEngine,
  stopHeartbeatEngine,
  reloadHeartbeatEngine,
  getHeartbeatEngineStatus,
  updateAndReloadHeartbeat,
} from "./functions/heartbeat-engine.js";
export {
  createBackupSnapshot,
  listBackupSnapshots,
  verifyBackupSnapshot,
} from "./functions/backup.js";
export type {
  BackupEntry,
  BackupManifest,
  BackupSummary,
  VerifyBackupResult,
} from "./functions/backup.js";
export { runReset } from "./functions/reset.js";
export type {
  ResetScope,
  ResetTarget,
  ResetResult,
} from "./functions/reset.js";
export { runSecurityAudit } from "./functions/security-audit.js";
export type {
  SecuritySeverity,
  SecurityFinding,
  SecurityAuditReport,
} from "./functions/security-audit.js";
export { getStatusReport } from "./functions/status.js";
export type {
  StatusSelfTestSummary,
  StatusRuntime,
  StatusSummary,
  StatusReport,
} from "./functions/status.js";
export { getAlertsReport } from "./functions/alerts.js";
export type {
  AlertSeverity,
  AlertItem,
  AlertsReport,
} from "./functions/alerts.js";
export {
  listIncidents,
  getIncident,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
} from "./functions/incidents.js";
export type {
  IncidentStatus,
  IncidentSeverity,
  IncidentRecord,
} from "./functions/incidents.js";
export {
  listMaintenanceWindows,
  upsertMaintenanceWindow,
  deleteMaintenanceWindow,
  getMaintenanceStatus,
} from "./functions/maintenance-windows.js";
export type {
  MaintenanceWindow,
  MaintenanceStatus,
} from "./functions/maintenance-windows.js";
export {
  createBackgroundTask,
  markTaskRunning,
  markTaskCompleted,
  markTaskFailed,
  markTaskCanceled,
  addTaskLog,
  getBackgroundTask,
  resolveBackgroundTask,
  listBackgroundTasks,
  getTaskLedgerStats,
  runTaskLedgerAudit,
  runTaskLedgerMaintenance,
  cancelBackgroundTask,
  updateBackgroundTaskNotifyPolicy,
  startTaskLedgerMaintenanceSweeper,
  stopTaskLedgerMaintenanceSweeper,
  getTaskLedgerMaintenanceStatus,
} from "./functions/tasks-ledger.js";
export {
  computeCacheKey,
  getCachedResponse,
  putCachedResponse,
  clearResponseCache,
  getResponseCacheStats,
  replayCachedResponse,
  shouldUseCache,
  getCachedResponseFor,
} from "./utils/response-cache.js";
export {
  estimateTokensFromText,
  estimateTokensFromLength,
  estimateCostUsd,
  summarizeCosts,
  resolvePricingRule,
} from "./utils/costs.js";
export {
  startConversation,
  getConversations,
  sendConversationMessage,
  summarizeConversationNow,
} from "./functions/conversation-chat.js";
