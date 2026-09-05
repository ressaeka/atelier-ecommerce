import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('redis.url');

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async set(key: string, value: string, ttlInSeconds?: number): Promise<void> {
    if (ttlInSeconds !== undefined) {
      await this.redis.set(key, value, 'EX', ttlInSeconds);
      return;
    }

    await this.redis.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, ttlInSeconds: number): Promise<void> {
    await this.redis.expire(key, ttlInSeconds);
  }

  async incrWithTtl(key: string, ttlInSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, ttlInSeconds);
    }
    return count;
  }

  /*
   * Set hanya kalau key belum ada.
   *
   * Dipakai untuk operasi yang harus atomik,
   * misalnya rotasi refresh token.
   */
  async setIfNotExists(
    key: string,
    value: string,
    ttlInSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.set(key, value, 'EX', ttlInSeconds, 'NX');

    return result === 'OK';
  }

  /*
   * Set value baru dan kembalikan value sebelumnya secara atomik.
   * Cocok untuk claim/rotasi token yang aman dari race condition.
   */
  async getSet(
    key: string,
    value: string,
    ttlInSeconds?: number,
  ): Promise<string | null> {
    if (ttlInSeconds !== undefined) {
      return this.redis.set(key, value, 'EX', ttlInSeconds, 'GET');
    }

    return this.redis.getset(key, value);
  }

  /*
   * Scan key dengan pattern.
   *
   * Dipakai saat perlu mencari key
   * yang tidak punya index, misalnya family session.
   */
  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];

    let cursor = '0';

    do {
      const [nextCursor, found] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      keys.push(...found);
    } while (cursor !== '0');

    return keys;
  }

  /*
   * Tambahkan member ke Redis Set.
   *
   * Dipakai untuk menyimpan daftar session (family + refresh token)
   * per user, agar tidak perlu SCAN seluruh keyspace.
   */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  /*
   * Ambil semua member dari Redis Set.
   */
  async sMembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
