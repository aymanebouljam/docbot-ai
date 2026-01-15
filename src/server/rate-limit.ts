const RATE_LIMIT_WINDOW_MS = 60_000;
const MESSAGE_RATE_LIMIT_MAX = 5;

type RateLimitRecord = {
  count: number;
  expiresAt: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

function getRateLimitKey(input: { request: Request; scope: string }) {
  const forwardedFor = input.request.headers.get("x-forwarded-for");
  const clientId = forwardedFor?.split(",")[0]?.trim() || "local";

  return `${input.scope}:${clientId}`;
}

export function checkRateLimit(input: { request: Request; scope: string }) {
  const now = Date.now();
  const key = getRateLimitKey(input);
  const currentRecord = rateLimitStore.get(key);

  if (!currentRecord || currentRecord.expiresAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: MESSAGE_RATE_LIMIT_MAX - 1,
    } as const;
  }

  if (currentRecord.count >= MESSAGE_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((currentRecord.expiresAt - now) / 1_000)
      ),
    } as const;
  }

  currentRecord.count += 1;
  rateLimitStore.set(key, currentRecord);

  return {
    allowed: true,
    remaining: Math.max(0, MESSAGE_RATE_LIMIT_MAX - currentRecord.count),
  } as const;
}

export function resetRateLimitStore() {
  rateLimitStore.clear();
}
