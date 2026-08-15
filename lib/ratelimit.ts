import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  reason?: 'session_limit_exceeded' | 'avatar_daily_limit_exceeded';
  message?: string;
}

export const SESSION_MESSAGE_LIMIT = 20;
export const AVATAR_DAILY_QUERY_LIMIT = 100;

// In-memory sliding window cache for fallback / testing
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

function cleanMemoryStore() {
  const now = Date.now();
  memoryStore.forEach((record, key) => {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  });
}

export class RateLimiterService {
  private redis: Redis | null = null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token && !url.includes('placeholder')) {
      try {
        this.redis = new Redis({
          url,
          token,
        });
      } catch (err) {
        console.warn('Failed to initialize Upstash Redis, falling back to memory rate limiting:', err);
        this.redis = null;
      }
    }
  }

  /**
   * Check and increment session message limit (cap of 20 messages per session)
   */
  async checkSessionLimit(sessionId: string, currentDbMessageCount?: number): Promise<RateLimitResult> {
    // If DB count already equals or exceeds limit, reject immediately
    if (typeof currentDbMessageCount === 'number' && currentDbMessageCount >= SESSION_MESSAGE_LIMIT) {
      return {
        allowed: false,
        limit: SESSION_MESSAGE_LIMIT,
        remaining: 0,
        resetSeconds: 0,
        reason: 'session_limit_exceeded',
        message: "You've completed your initial interview with this candidate's avatar. Ready to schedule a live interview?",
      };
    }

    const key = `ratelimit:session:${sessionId}`;
    const windowSeconds = 60 * 60 * 24; // 24 hours

    if (this.redis) {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, windowSeconds);
        }
        const remaining = Math.max(0, SESSION_MESSAGE_LIMIT - count);

        if (count > SESSION_MESSAGE_LIMIT) {
          return {
            allowed: false,
            limit: SESSION_MESSAGE_LIMIT,
            remaining: 0,
            resetSeconds: windowSeconds,
            reason: 'session_limit_exceeded',
            message: "You've completed your initial interview with this candidate's avatar. Ready to schedule a live interview?",
          };
        }

        return {
          allowed: true,
          limit: SESSION_MESSAGE_LIMIT,
          remaining,
          resetSeconds: windowSeconds,
        };
      } catch (error) {
        console.error('Redis error during session rate limit check:', error);
      }
    }

    // Fallback in-memory rate limiting
    cleanMemoryStore();
    const now = Date.now();
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return {
        allowed: true,
        limit: SESSION_MESSAGE_LIMIT,
        remaining: SESSION_MESSAGE_LIMIT - 1,
        resetSeconds: windowSeconds,
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, SESSION_MESSAGE_LIMIT - existing.count);

    if (existing.count > SESSION_MESSAGE_LIMIT) {
      return {
        allowed: false,
        limit: SESSION_MESSAGE_LIMIT,
        remaining: 0,
        resetSeconds: Math.ceil((existing.resetAt - now) / 1000),
        reason: 'session_limit_exceeded',
        message: "You've completed your initial interview with this candidate's avatar. Ready to schedule a live interview?",
      };
    }

    return {
      allowed: true,
      limit: SESSION_MESSAGE_LIMIT,
      remaining,
      resetSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  /**
   * Check and increment avatar daily query limit (cap of 100 queries/day per avatar across all sessions)
   */
  async checkAvatarDailyLimit(avatarId: string): Promise<RateLimitResult> {
    const key = `ratelimit:avatar_daily:${avatarId}`;
    const windowSeconds = 60 * 60 * 24; // 24 hours sliding window

    if (this.redis) {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, windowSeconds);
        }
        const remaining = Math.max(0, AVATAR_DAILY_QUERY_LIMIT - count);

        if (count > AVATAR_DAILY_QUERY_LIMIT) {
          return {
            allowed: false,
            limit: AVATAR_DAILY_QUERY_LIMIT,
            remaining: 0,
            resetSeconds: windowSeconds,
            reason: 'avatar_daily_limit_exceeded',
            message: 'This avatar has reached its daily conversation limit. Please try again tomorrow.',
          };
        }

        return {
          allowed: true,
          limit: AVATAR_DAILY_QUERY_LIMIT,
          remaining,
          resetSeconds: windowSeconds,
        };
      } catch (error) {
        console.error('Redis error during avatar rate limit check:', error);
      }
    }

    // Fallback in-memory rate limiting
    cleanMemoryStore();
    const now = Date.now();
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return {
        allowed: true,
        limit: AVATAR_DAILY_QUERY_LIMIT,
        remaining: AVATAR_DAILY_QUERY_LIMIT - 1,
        resetSeconds: windowSeconds,
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, AVATAR_DAILY_QUERY_LIMIT - existing.count);

    if (existing.count > AVATAR_DAILY_QUERY_LIMIT) {
      return {
        allowed: false,
        limit: AVATAR_DAILY_QUERY_LIMIT,
        remaining: 0,
        resetSeconds: Math.ceil((existing.resetAt - now) / 1000),
        reason: 'avatar_daily_limit_exceeded',
        message: 'This avatar has reached its daily conversation limit. Please try again tomorrow.',
      };
    }

    return {
      allowed: true,
      limit: AVATAR_DAILY_QUERY_LIMIT,
      remaining,
      resetSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  /**
   * Helper to clear rate limit keys (useful for testing)
   */
  clearAllMemory() {
    memoryStore.clear();
  }
}

export const rateLimiter = new RateLimiterService();
