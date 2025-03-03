import { Page } from 'puppeteer'
import { PuppeteerManager } from './puppeteer-manager'
import Redis from 'ioredis'
import PQueue from 'p-queue'

const CACHE_TTL = 3600 // 1 hour in seconds
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const queue = new PQueue({ concurrency: 2 })

export abstract class BaseScraper {
  protected puppeteerManager: PuppeteerManager

  constructor() {
    this.puppeteerManager = PuppeteerManager.getInstance()
  }

  protected abstract scrapeProductDetails(page: Page, query: string): Promise<any[]>

  protected async getCachedResults(key: string): Promise<any | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  protected async cacheResults(key: string, data: any): Promise<void> {
    await redis.setex(key, CACHE_TTL, JSON.stringify(data))
  }

  protected async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
      }
    }
    
    throw lastError
  }

  async search(query: string): Promise<any> {
    const cacheKey = `search:${this.constructor.name}:${query}`
    const cached = await this.getCachedResults(cacheKey)
    
    if (cached) {
      return cached
    }

    return await queue.add(async () => {
      const page = await this.puppeteerManager.getPage()
      
      try {
        const results = await this.withRetry(() => 
          this.scrapeProductDetails(page, query)
        )
        
        await this.cacheResults(cacheKey, results)
        return results
      } finally {
        await page.close()
      }
    })
  }
} 