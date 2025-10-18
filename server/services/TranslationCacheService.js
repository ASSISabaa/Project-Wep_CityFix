// server/services/TranslationCacheService.js
const { getRedisClient } = require('../config/redis');

class TranslationCacheService {
  constructor() {
    // In-Memory Cache (أسرع)
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 1000; // أقصى عدد للعناصر في الذاكرة
    this.cacheExpiry = 7 * 24 * 60 * 60; // 7 أيام بالثواني
  }

  /**
   * إنشاء مفتاح فريد للترجمة
   */
  createKey(text, fromLang, toLang) {
    // استخدام hash للنص الطويل
    const textHash = this.simpleHash(text);
    return `trans:${fromLang}:${toLang}:${textHash}`;
  }

  /**
   * الحصول على ترجمة من الكاش
   */
  async get(text, fromLang, toLang) {
    const key = this.createKey(text, fromLang, toLang);

    // 1. البحث في Memory Cache أولاً (أسرع)
    if (this.memoryCache.has(key)) {
      console.log('📦 Cache HIT (Memory)');
      return this.memoryCache.get(key);
    }

    // 2. البحث في Redis (إذا كان متوفراً)
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      try {
        const cached = await redisClient.get(key);
        if (cached) {
          console.log('📦 Cache HIT (Redis)');
          // حفظ في Memory Cache للمرة القادمة
          this.setMemoryCache(key, cached);
          return cached;
        }
      } catch (error) {
        console.warn('Redis get error:', error.message);
      }
    }

    console.log('❌ Cache MISS');
    return null;
  }

  /**
   * حفظ ترجمة في الكاش
   */
  async set(text, fromLang, toLang, translation) {
    const key = this.createKey(text, fromLang, toLang);

    // 1. حفظ في Memory Cache
    this.setMemoryCache(key, translation);

    // 2. حفظ في Redis (إذا كان متوفراً)
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.setEx(key, this.cacheExpiry, translation);
        console.log('✅ Saved to Redis cache');
      } catch (error) {
        console.warn('Redis set error:', error.message);
      }
    }
  }

  /**
   * حفظ في Memory Cache
   */
  setMemoryCache(key, value) {
    // إذا وصل الكاش للحد الأقصى، احذف الأقدم
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, value);
  }

  /**
   * حذف من الكاش
   */
  async delete(text, fromLang, toLang) {
    const key = this.createKey(text, fromLang, toLang);

    // حذف من Memory
    this.memoryCache.delete(key);

    // حذف من Redis
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.warn('Redis delete error:', error.message);
      }
    }
  }

  /**
   * مسح كل الكاش
   */
  async clearAll() {
    // مسح Memory Cache
    this.memoryCache.clear();
    console.log('🗑️ Memory cache cleared');

    // مسح Redis Cache
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('trans:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log(`🗑️ Redis cache cleared (${keys.length} keys)`);
        }
      } catch (error) {
        console.warn('Redis clear error:', error.message);
      }
    }
  }

  /**
   * احصائيات الكاش
   */
  async getStats() {
    const stats = {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize,
        percentage: ((this.memoryCache.size / this.maxMemoryCacheSize) * 100).toFixed(2) + '%'
      },
      redis: {
        available: false,
        keysCount: 0
      }
    };

    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('trans:*');
        stats.redis = {
          available: true,
          keysCount: keys.length
        };
      } catch (error) {
        console.warn('Redis stats error:', error.message);
      }
    }

    return stats;
  }

  /**
   * Hash بسيط للنص
   */
  simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * تنظيف الكاش القديم
   */
  async cleanupOldCache(daysOld = 30) {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) return;

    try {
      const keys = await redisClient.keys('trans:*');
      let deletedCount = 0;

      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        // إذا كان TTL أقل من 0 أو انتهى
        if (ttl < 0) {
          await redisClient.del(key);
          deletedCount++;
        }
      }

      console.log(`🧹 Cleaned ${deletedCount} old cache entries`);
      return deletedCount;
    } catch (error) {
      console.warn('Cache cleanup error:', error.message);
      return 0;
    }
  }
}

module.exports = TranslationCacheService;