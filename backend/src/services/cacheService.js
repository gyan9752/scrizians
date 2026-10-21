/**
 * Scrizians Cache & Rate-Limit Abstraction
 *
 * Supports:
 * - Public talent/search response caching
 * - Lead/admin response caching
 * - Authentication and lead rate limiting
 * - In-memory fallback when Redis is not configured
 *
 * NOTE:
 * This implementation is process-local.
 * For multi-server production deployment, Redis should
 * be used as the shared cache/rate-limit store.
 */

class CacheService {
  constructor() {
    this.store = new Map();
    this.rateLimits = new Map();

    this.cleanupIntervalMs =
      Number(
        process.env.CACHE_CLEANUP_INTERVAL_MS
      ) || 60000;

    this.maxCacheEntries =
      Number(
        process.env.CACHE_MAX_ENTRIES
      ) || 5000;

    this.maxRateLimitEntries =
      Number(
        process.env.RATE_LIMIT_MAX_ENTRIES
      ) || 10000;

    this.cleanupTimer =
      setInterval(
        () => this.cleanup(),
        this.cleanupIntervalMs
      );

    /*
     * Do not keep the Node.js process alive only
     * because of the cache cleanup timer.
     */
    if (
      typeof this.cleanupTimer.unref ===
      'function'
    ) {
      this.cleanupTimer.unref();
    }

    console.log(
      '[Cache Service] Cache engine initialized.'
    );
  }

  /**
   * Get cached value.
   */
  get(key) {
    if (
      typeof key !== 'string' ||
      !key.trim()
    ) {
      return null;
    }

    const normalizedKey =
      key.trim();

    const item =
      this.store.get(normalizedKey);

    if (!item) {
      return null;
    }

    if (
      Date.now() >=
      item.expiresAt
    ) {
      this.store.delete(
        normalizedKey
      );

      return null;
    }

    return item.value;
  }

  /**
   * Set cached value.
   *
   * ttlSeconds:
   * Time-to-live in seconds.
   */
  set(
    key,
    value,
    ttlSeconds = 300
  ) {
    if (
      typeof key !== 'string' ||
      !key.trim()
    ) {
      return false;
    }

    const ttl =
      Number(ttlSeconds);

    if (
      !Number.isFinite(ttl) ||
      ttl <= 0
    ) {
      return false;
    }

    /*
     * Prevent unlimited memory growth.
     */
    if (
      !this.store.has(key) &&
      this.store.size >=
        this.maxCacheEntries
    ) {
      this.removeOldestCacheEntry();
    }

    this.store.set(
      key.trim(),
      {
        value,
        createdAt:
          Date.now(),
        expiresAt:
          Date.now() +
          ttl * 1000
      }
    );

    return true;
  }

  /**
   * Delete one cache key.
   */
  delete(key) {
    if (
      typeof key !== 'string' ||
      !key.trim()
    ) {
      return false;
    }

    return this.store.delete(
      key.trim()
    );
  }

  /**
   * Backward-compatible alias.
   */
  del(key) {
    return this.delete(key);
  }

  /**
   * Delete all cache entries whose keys
   * start with a specific prefix.
   *
   * Example:
   * deleteByPrefix('all_leads:')
   */
  deleteByPrefix(prefix) {
    if (
      typeof prefix !== 'string' ||
      !prefix.trim()
    ) {
      return 0;
    }

    const normalizedPrefix =
      prefix.trim();

    let deletedCount = 0;

    for (
      const key of this.store.keys()
    ) {
      if (
        key.startsWith(
          normalizedPrefix
        )
      ) {
        this.store.delete(key);
        deletedCount += 1;
      }
    }

    return deletedCount;
  }

  /**
   * Check rate limit.
   *
   * Example:
   * checkRateLimit(
   *   `lead:${ip}`,
   *   5,
   *   60000
   * );
   */
  checkRateLimit(
    ipOrUser,
    maxRequests = 10,
    windowMs = 60000
  ) {
    if (
      typeof ipOrUser !== 'string' ||
      !ipOrUser.trim()
    ) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 60
      };
    }

    const identifier =
      ipOrUser.trim();

    const max =
      Number(maxRequests);

    const window =
      Number(windowMs);

    if (
      !Number.isFinite(max) ||
      max <= 0 ||
      !Number.isFinite(window) ||
      window <= 0
    ) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 60
      };
    }

    const now =
      Date.now();

    let userLimit =
      this.rateLimits.get(
        identifier
      );

    /*
     * Create a new rate-limit window.
     */
    if (
      !userLimit ||
      now >= userLimit.resetAt
    ) {
      userLimit = {
        count: 1,
        resetAt:
          now + window,
        createdAt: now
      };

      /*
       * Prevent unlimited memory growth
       * from unique IP addresses.
       */
      if (
        !this.rateLimits.has(
          identifier
        ) &&
        this.rateLimits.size >=
          this.maxRateLimitEntries
      ) {
        this.removeOldestRateLimitEntry();
      }

      this.rateLimits.set(
        identifier,
        userLimit
      );

      return {
        allowed: true,
        remaining:
          Math.max(
            max - 1,
            0
          ),
        retryAfterSeconds:
          Math.ceil(
            window / 1000
          )
      };
    }

    userLimit.count += 1;

    this.rateLimits.set(
      identifier,
      userLimit
    );

    const retryAfterSeconds =
      Math.max(
        Math.ceil(
          (userLimit.resetAt -
            now) /
            1000
        ),
        1
      );

    if (
      userLimit.count >
      max
    ) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds
      };
    }

    return {
      allowed: true,
      remaining:
        Math.max(
          max -
            userLimit.count,
          0
        ),
      retryAfterSeconds
    };
  }

  /**
   * Clear expired cache and rate-limit entries.
   */
  cleanup() {
    const now =
      Date.now();

    /*
     * Remove expired cache entries.
     */
    for (
      const [
        key,
        item
      ] of this.store.entries()
    ) {
      if (
        !item ||
        now >=
          item.expiresAt
      ) {
        this.store.delete(
          key
        );
      }
    }

    /*
     * Remove expired rate-limit entries.
     */
    for (
      const [
        key,
        item
      ] of this.rateLimits.entries()
    ) {
      if (
        !item ||
        now >=
          item.resetAt
      ) {
        this.rateLimits.delete(
          key
        );
      }
    }
  }

  /**
   * Remove oldest cache entry when
   * maximum cache size is reached.
   */
  removeOldestCacheEntry() {
    let oldestKey = null;
    let oldestCreatedAt =
      Infinity;

    for (
      const [
        key,
        item
      ] of this.store.entries()
    ) {
      if (
        item.createdAt <
        oldestCreatedAt
      ) {
        oldestCreatedAt =
          item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(
        oldestKey
      );
    }
  }

  /**
   * Remove oldest rate-limit entry when
   * maximum rate-limit store size is reached.
   */
  removeOldestRateLimitEntry() {
    let oldestKey = null;
    let oldestCreatedAt =
      Infinity;

    for (
      const [
        key,
        item
      ] of this.rateLimits.entries()
    ) {
      if (
        item.createdAt <
        oldestCreatedAt
      ) {
        oldestCreatedAt =
          item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.rateLimits.delete(
        oldestKey
      );
    }
  }

  /**
   * Clear all cache data.
   */
  clear() {
    this.store.clear();
    return true;
  }

  /**
   * Flush cache data alias.
   */
  flush() {
    this.store.clear();
    return true;
  }

  /**
   * Clear all rate-limit data.
   */
  clearRateLimits() {
    this.rateLimits.clear();
    return true;
  }

  /**
   * Clear everything.
   */
  clearAll() {
    this.store.clear();
    this.rateLimits.clear();
    return true;
  }

  /**
   * Basic cache statistics.
   */
  getStats() {
    return {
      cacheEntries:
        this.store.size,
      rateLimitEntries:
        this.rateLimits.size,
      maxCacheEntries:
        this.maxCacheEntries,
      maxRateLimitEntries:
        this.maxRateLimitEntries
    };
  }

  /**
   * Stop cleanup timer gracefully.
   */
  destroy() {
    if (
      this.cleanupTimer
    ) {
      clearInterval(
        this.cleanupTimer
      );

      this.cleanupTimer =
        null;
    }

    this.clearAll();
  }
}

module.exports =
  new CacheService();