import 'dotenv/config';
import { AuthService } from '../src/auth/auth.service.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { UnauthorizedException } from '@nestjs/common';

async function run() {
  console.log('--- STARTING PHASE 1 TEST: GOOGLE OAUTH CODE EXCHANGE ---');

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const mockConfig = {
    getOrThrow: (key: string) => {
      if (key === 'redis.url') return redisUrl;
      return '';
    },
    get: (key: string, def?: any) => def,
  };

  const redisService = new RedisService(mockConfig as any);
  const authService = new AuthService(
    {} as any, // usersService
    {} as any, // prismaService
    {} as any, // jwtService
    mockConfig as any, // configService
    redisService,
    {} as any, // mailService
    {} as any, // loginRateLimitService
    {} as any, // forgotRateLimitService
    {} as any, // otpRateLimitService
  );

  try {
    const testPayload = {
      access_token: 'mock_jwt_access_token_xyz',
      refresh_token: 'mock_jwt_refresh_token_abc',
      user: { id: 9999, name: 'Test OAuth User', email: 'test_oauth@atelier.local', role: 'USER' },
    };

    // Test 1: Generate high-entropy code and verify it exists in Redis
    console.log('[Test 1] Generating OAuth exchange code...');
    const code = await authService.createOAuthExchangeCode(testPayload);
    if (!code || typeof code !== 'string' || code.length < 32) {
      throw new Error(`Invalid code generated: ${code}`);
    }
    console.log(`[Test 1 PASSED] Generated secure code: ${code.slice(0, 8)}... (length: ${code.length})`);

    // Test 2: Invalid code must be rejected
    console.log('[Test 2] Testing invalid code rejection...');
    let invalidCaught = false;
    try {
      await authService.exchangeOAuthCode('non-existent-code-12345');
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        invalidCaught = true;
      }
    }
    if (!invalidCaught) {
      throw new Error('Expected invalid code to throw UnauthorizedException');
    }
    console.log('[Test 2 PASSED] Invalid code properly rejected with UnauthorizedException');

    // Test 3: Successful single-use exchange
    console.log('[Test 3] Testing successful code exchange...');
    const exchangeResult = await authService.exchangeOAuthCode(code);
    if (
      !exchangeResult ||
      exchangeResult.data.access_token !== testPayload.access_token ||
      exchangeResult.data.refresh_token !== testPayload.refresh_token
    ) {
      throw new Error('Exchanged payload does not match original payload');
    }
    console.log('[Test 3 PASSED] Code successfully exchanged for tokens');

    // Test 4: Replay attack prevention - code cannot be reused
    console.log('[Test 4] Testing reuse prevention (replay attack)...');
    let reuseCaught = false;
    try {
      await authService.exchangeOAuthCode(code);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        reuseCaught = true;
      }
    }
    if (!reuseCaught) {
      throw new Error('Expected reused code to be rejected');
    }
    console.log('[Test 4 PASSED] Code cannot be reused; single-use guarantee verified');

    // Test 5: Concurrency race condition simulation
    console.log('[Test 5] Simulating concurrent exchange of the same code...');
    const concurrentCode = await authService.createOAuthExchangeCode(testPayload);
    
    const results = await Promise.allSettled([
      authService.exchangeOAuthCode(concurrentCode),
      authService.exchangeOAuthCode(concurrentCode),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    if (fulfilled.length !== 1 || rejected.length !== 1) {
      throw new Error(
        `Expected exactly 1 success and 1 failure on concurrent exchange, got ${fulfilled.length} fulfilled and ${rejected.length} rejected`,
      );
    }
    console.log('[Test 5 PASSED] Exactly 1 exchange succeeded, concurrent request blocked atomically');

    console.log('--- ALL PHASE 1 TESTS PASSED SUCCESSFULLY ---');
  } finally {
    await redisService.onModuleDestroy();
  }
}

run().catch((err) => {
  console.error('Phase 1 test failed:', err);
  process.exit(1);
});
