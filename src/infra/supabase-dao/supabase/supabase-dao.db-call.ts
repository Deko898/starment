import type { MetricsService } from '@starment/metrics';

export interface DbCallOptions {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  label?: string;
  // optional: treat some statuses as retryable (e.g. 429), default false
  retryOn429?: boolean;
}

let metrics: MetricsService | undefined;

export const setSupabaseDaoMetrics = (m?: MetricsService): void => {
  metrics = m;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(p: PromiseLike<T>, ms: number, label?: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`dbCall timeout after ${ms}ms${label ? ` [${label}]` : ''}`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e as Error);
      },
    );
  });
}

function isRetryable(err: unknown, opts: DbCallOptions): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  const msg = (err.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('connect') || msg.includes('reset')) {
    return true;
  }

  const anyErr = err as { status?: number; code?: string };
  if (typeof anyErr.status === 'number') {
    if (anyErr.status >= 500 && anyErr.status < 600) {
      return true;
    } // 5xx
    if (opts.retryOn429 && anyErr.status === 429) {
      return true;
    } // optional
    if (anyErr.status === 408) {
      return true;
    } // request timeout
  }

  if (anyErr.code && ['ECONNRESET', 'ETIMEDOUT'].includes(anyErr.code)) {
    return true;
  }

  return false;
}

/** Wrap a Supabase call factory with timeout + selective retries + metrics */
export async function dbCall<T extends object>(
  fn: () => PromiseLike<T>,
  opts: DbCallOptions = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? Number(process.env.DB_TIMEOUT_MS ?? 2000);
  const retries = opts.retries ?? Number(process.env.DB_RETRIES ?? 2);
  const baseDelay = opts.baseDelayMs ?? 150;
  const label = opts.label ?? 'unknown';

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const attemptStart = Date.now();
    try {
      const result = await withTimeout(fn(), timeoutMs, label);

      if (process.env.NODE_ENV !== 'production') {
        const dur = Date.now() - attemptStart;

        console.debug(`dbCall [${label}] ok in ${dur}ms (attempt ${attempt + 1})`);
      }

      metrics?.dbCallDuration.labels(label, 'ok').observe(Date.now() - attemptStart);
      return result;
    } catch (err) {
      lastErr = err;

      const retryable = attempt < retries && isRetryable(err, opts);

      // classify this attempt’s outcome
      const msg = String(err).toLowerCase();
      const outcome = msg.includes('timeout') ? 'timeout' : retryable ? 'retry' : 'failed';

      metrics?.dbCallDuration.labels(label, outcome).observe(Date.now() - attemptStart);

      if (!retryable) {
        break;
      }

      const delay = Math.min(
        Math.round(baseDelay * Math.pow(2, attempt) + Math.random() * 50),
        2000,
      );

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `dbCall [${label}] attempt ${attempt + 1} failed: ${String(err)}. Retrying in ${delay}ms`,
        );
      }
      await sleep(delay);
    }
  }

  // Final failure (no more retries)
  const prefix = label ? `[${label}] ` : '';
  throw new Error(`${prefix}dbCall failed after ${retries + 1} attempts: ${String(lastErr)}`);
}
