const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LevelName = keyof typeof LEVELS;

function getLevel(): number {
  const env = (process.env.KAGI_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info").toLowerCase();
  const key = env as LevelName;
  return LEVELS[key] ?? LEVELS.info;
}

function formatOutput(level: string, msg: string, meta?: unknown) {
  const out: Record<string, unknown> = {
    ts: new Date().toISOString(),
    name: "kagi-translate-mcp",
    level,
    msg,
  };

  if (meta !== undefined) out.meta = meta;
  return JSON.stringify(out);
}

export function error(msg: string, meta?: unknown): void {
  if (getLevel() >= LEVELS.error) {
    console.error(formatOutput("error", msg, meta));
  }
}

export function warn(msg: string, meta?: unknown): void {
  if (getLevel() >= LEVELS.warn) {
    console.error(formatOutput("warn", msg, meta));
  }
}

export function info(msg: string, meta?: unknown): void {
  if (getLevel() >= LEVELS.info) {
    console.error(formatOutput("info", msg, meta));
  }
}

export function debug(msg: string, meta?: unknown): void {
  if (getLevel() >= LEVELS.debug) {
    console.error(formatOutput("debug", msg, meta));
  }
}

export default { error, warn, info, debug };
