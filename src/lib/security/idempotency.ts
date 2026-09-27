interface IdempotencyRecord<T> {
  result: T;
  timestamp: number;
}

const idempotencyCache = new Map<string, IdempotencyRecord<any>>();

// Cache cleanup every 15 minutes (records expire after 24 hours)
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of idempotencyCache.entries()) {
      if (now - record.timestamp > IDEMPOTENCY_TTL_MS) {
        idempotencyCache.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

/**
 * Executes a mutation with idempotency guarantee for the given key and businessId
 */
export async function withIdempotency<T>(
  businessId: string,
  idempotencyKey: string | undefined,
  operation: () => Promise<T>
): Promise<T> {
  if (!idempotencyKey) {
    return operation();
  }

  const cacheKey = `${businessId}:${idempotencyKey}`;
  const cached = idempotencyCache.get(cacheKey);

  if (cached) {
    return cached.result;
  }

  const result = await operation();
  idempotencyCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });

  return result;
}
