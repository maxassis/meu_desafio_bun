import { LRUCache } from 'lru-cache'

class CacheService {
  private cache: LRUCache<string, any>

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutos padrão
      allowStale: false,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get(key)
      return value !== undefined ? (value as T) : null
    }
    catch (error) {
      console.error('[Cache] get error:', error)
      throw error
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds !== undefined) {
        this.cache.set(key, value, { ttl: ttlSeconds * 1000 })
      }
      else {
        this.cache.set(key, value)
      }
    }
    catch (error) {
      console.error('[Cache] set error:', error)
      throw error
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key)
    }
    catch (error) {
      console.error('[Cache] del error:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.cache.clear()
  }
}

export const cacheService = new CacheService()
