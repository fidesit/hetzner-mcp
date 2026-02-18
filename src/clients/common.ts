/**
 * Shared HTTP utilities, types, and helpers for all Hetzner API clients.
 */

// ── Rate Limit ──────────────────────────────────────────────────────────────

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('RateLimit-Limit');
  const remaining = headers.get('RateLimit-Remaining');
  const reset = headers.get('RateLimit-Reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }
  return null;
}

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  per_page: number;
  previous_page: number | null;
  next_page: number | null;
  last_page: number;
  total_entries: number;
}

// ── Actions ─────────────────────────────────────────────────────────────────

export interface HetznerAction {
  id: number;
  command: string;
  status: 'running' | 'success' | 'error';
  progress: number;
  started: string;
  finished: string | null;
  resources: Array<{ id: number; type: string }>;
  error?: { code: string; message: string };
}

// ── Errors ──────────────────────────────────────────────────────────────────

export class HetznerApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(`[Hetzner:${status}:${code}] ${message}`);
    this.name = 'HetznerApiError';
  }
}

export class RobotApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly path: string,
  ) {
    super(`[Robot:${status || code}] ${message} (${path})`);
    this.name = 'RobotApiError';
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format any error into a user-readable string for MCP tool responses.
 */
export function formatError(error: unknown): string {
  if (error instanceof HetznerApiError) {
    let msg = `Error ${error.status} (${error.code}): ${error.message}`;
    if (error.details) msg += `\nDetails: ${JSON.stringify(error.details)}`;
    return msg;
  }
  if (error instanceof RobotApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: ${String(error)}`;
}

/**
 * Remove null/undefined/empty-string values from a params object.
 */
export function cleanParams(
  obj: Record<string, string | number | boolean | undefined | null>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = String(value);
    }
  }
  return result;
}
