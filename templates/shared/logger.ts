type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

class Logger {
  private minLevel: LogLevel;
  private isProduction: boolean;
  private defaultContext: LogContext;

  constructor(
    options: {
      level?: LogLevel;
      context?: LogContext;
    } = {}
  ) {
    this.isProduction = process.env.NODE_ENV === "production";
    this.minLevel = options.level ?? (this.isProduction ? "info" : "debug");
    this.defaultContext = options.context ?? {};
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
  }

  private formatDev(entry: LogEntry): string {
    const color = LEVEL_COLORS[entry.level];
    const levelTag = `${color}${BOLD}[${entry.level.toUpperCase()}]${RESET}`;
    const time = `${DIM}${entry.timestamp}${RESET}`;

    let output = `${levelTag} ${time} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = Object.entries(entry.context)
        .map(([k, v]) => `${DIM}${k}=${RESET}${JSON.stringify(v)}`)
        .join(" ");
      output += ` ${contextStr}`;
    }

    return output;
  }

  private formatProd(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      ...entry.context,
      context: undefined,
    });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
    };

    const formatted = this.isProduction ? this.formatProd(entry) : this.formatDev(entry);

    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      default:
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  // Create a child logger with additional context
  child(context: LogContext): Logger {
    const child = new Logger({
      level: this.minLevel,
      context: { ...this.defaultContext, ...context },
    });
    return child;
  }

  // Time an operation
  time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { durationMs: Math.round(duration) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, { durationMs: Math.round(duration), error });
      throw error;
    }
  }

  // Time an async operation
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { durationMs: Math.round(duration) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, { durationMs: Math.round(duration), error });
      throw error;
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Factory for creating loggers with context
export function createLogger(context?: LogContext): Logger {
  return new Logger({ context });
}

export { Logger, type LogLevel, type LogContext };
