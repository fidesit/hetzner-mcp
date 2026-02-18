/**
 * Hetzner Robot API client (robot-ws.your-server.de).
 * Uses HTTP Basic auth, form-encoded POST bodies, JSON responses.
 * Implements request queuing, exponential backoff on 429s, and retries.
 */

import type { RobotConfig } from '../config.js';
import { RobotApiError, sleep } from './common.js';

interface RequestOptions {
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

export class RobotClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeout = 30_000;
  private readonly maxRetries = 3;

  // Serial request queue to respect Robot API rate limits
  private readonly requestQueue: Array<() => Promise<void>> = [];
  private activeRequests = 0;
  private readonly maxConcurrent = 2;

  constructor(config: RobotConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader =
      'Basic ' + Buffer.from(`${config.user}:${config.password}`).toString('base64');
  }

  /**
   * Make an HTTP request to the Robot API.
   * POST bodies are sent as application/x-www-form-urlencoded (Robot API requirement).
   */
  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.enqueue(() => this.doRequest<T>(path, options));
  }

  private async doRequest<T>(path: string, options: RequestOptions): Promise<T> {
    const { method = 'GET', body, params } = options;
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json',
    };

    let requestBody: string | undefined;
    if (body) {
      // Robot API uses form-encoded POST bodies
      const formData = new URLSearchParams();
      this.flattenFormData(formData, body);
      requestBody = formData.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Rate limited — backoff and retry
        if (response.status === 429 || response.status === 403) {
          const retryAfter = response.headers.get('Retry-After');
          const jitter = Math.random() * 1000;
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.pow(2, attempt) * 1000 + jitter;

          console.error(
            `[Robot:${response.status}] Rate limited on ${path}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.maxRetries})`
          );
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null) as {
            error?: { status?: number; code?: string; message?: string };
          } | null;
          const err = errorBody?.error;
          throw new RobotApiError(
            response.status,
            err?.code ?? 'UNKNOWN',
            err?.message ?? response.statusText,
            path,
          );
        }

        // Some endpoints return empty body (204, DELETE)
        if (
          response.status === 204 ||
          response.headers.get('content-length') === '0'
        ) {
          return {} as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof RobotApiError) throw error;

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new RobotApiError(0, 'TIMEOUT', `Request timed out after ${this.timeout}ms`, path);
        }

        lastError = error as Error;
        if (attempt < this.maxRetries - 1) {
          const jitter = Math.random() * 1000;
          const delay = Math.pow(2, attempt) * 1000 + jitter;
          console.error(
            `[Robot] Network error on ${path}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.maxRetries}): ${lastError.message}`
          );
          await sleep(delay);
        }
      }
    }

    throw new RobotApiError(
      0,
      'NETWORK',
      `Request failed after ${this.maxRetries} attempts: ${lastError?.message ?? 'Unknown error'}`,
      path,
    );
  }

  /**
   * Flatten nested objects into form data with bracket notation.
   * e.g., { rules: { input: [{ action: 'accept' }] } }
   * becomes rules[input][0][action]=accept
   */
  private flattenFormData(
    formData: URLSearchParams,
    obj: Record<string, unknown>,
    prefix = '',
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.flattenFormData(formData, item as Record<string, unknown>, `${fullKey}[${index}]`);
          } else {
            formData.append(`${fullKey}[${index}]`, String(item));
          }
        });
      } else if (typeof value === 'object') {
        this.flattenFormData(formData, value as Record<string, unknown>, fullKey);
      } else {
        formData.append(fullKey, String(value));
      }
    }
  }

  // ── Request Queue ───────────────────────────────────────────────────────

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        this.activeRequests++;
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrent) {
        run();
      } else {
        this.requestQueue.push(run as () => Promise<void>);
      }
    });
  }

  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrent
    ) {
      const next = this.requestQueue.shift();
      next?.();
    }
  }
}
