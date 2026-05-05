import Redis from 'ioredis'
import { ENV } from 'varlock/env'

class CacheService {
  private redis: Redis | null = null

  constructor() {
    this.initRedis()
  }

  private initRedis() {
    if (!ENV.REDIS_HOST) {
      throw new Error('REDIS_HOST is required')
    }

    this.redis = new Redis({
      host: ENV.REDIS_HOST,
      port: ENV.REDIS_PORT ? Number(ENV.REDIS_PORT) : 6379,
      password: ENV.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('[Cache] Redis connection failed')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    this.redis.on('connect', () => {
      console.log('[Cache] Connected to Redis')
    })

    this.redis.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      throw new Error('Redis not initialized')
    }

    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    }
    catch (error) {
      console.error('[Cache] Redis get error:', error)
      throw error
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.redis) {
      throw new Error('Redis not initialized')
    }

    const ttl = ttlSeconds || 300

    try {
      await this.redis.set(key, JSON.stringify(value))
      await this.redis.expire(key, ttl)
    }
    catch (error) {
      console.error('[Cache] Redis set error:', error)
      throw error
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) {
      throw new Error('Redis not initialized')
    }

    try {
      await this.redis.del(key)
    }
    catch (error) {
      console.error('[Cache] Redis del error:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

export const cacheService = new CacheService()
