import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter, SESSION_MESSAGE_LIMIT, AVATAR_DAILY_QUERY_LIMIT } from '@/lib/ratelimit';

describe('Rate Limiting & Safety Controls', () => {
  beforeEach(() => {
    rateLimiter.clearAllMemory();
  });

  it('allows messages within session cap and strictly blocks messages above 20', async () => {
    const sessionId = 'test-session-xyz-123';

    // First 20 messages should be allowed
    for (let i = 1; i <= SESSION_MESSAGE_LIMIT; i++) {
      const res = await rateLimiter.checkSessionLimit(sessionId);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(SESSION_MESSAGE_LIMIT - i);
    }

    // 21st message should be blocked
    const blockedRes = await rateLimiter.checkSessionLimit(sessionId);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.reason).toBe('session_limit_exceeded');
  });

  it('enforces avatar daily query cap of 100 queries/day', async () => {
    const avatarId = 'avatar-test-daily-999';

    // Send 100 queries
    for (let i = 1; i <= AVATAR_DAILY_QUERY_LIMIT; i++) {
      const res = await rateLimiter.checkAvatarDailyLimit(avatarId);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(AVATAR_DAILY_QUERY_LIMIT - i);
    }

    // 101st query must be blocked
    const overflowRes = await rateLimiter.checkAvatarDailyLimit(avatarId);
    expect(overflowRes.allowed).toBe(false);
    expect(overflowRes.remaining).toBe(0);
    expect(overflowRes.reason).toBe('avatar_daily_limit_exceeded');
  });
});
