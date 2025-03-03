import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Browser, Page } from 'puppeteer'
import Redis from 'ioredis'
import PQueue from 'p-queue'

puppeteer.use(StealthPlugin())

// Initialize Redis for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Configure queue for rate limiting
const queue = new PQueue({
  concurrency: 2,
  interval: 1000,
  intervalCap: 2
})

export class PuppeteerManager {
  private static instance: PuppeteerManager
  private browser: Browser | null = null
  private readonly proxyList: string[]
  private currentProxyIndex = 0

  private constructor() {
    // Add your proxy list here
    this.proxyList = [
      process.env.PROXY_1 || '',
      process.env.PROXY_2 || '',
      // Add more proxies...
    ].filter(Boolean)
  }

  static getInstance(): PuppeteerManager {
    if (!PuppeteerManager.instance) {
      PuppeteerManager.instance = new PuppeteerManager()
    }
    return PuppeteerManager.instance
  }

  private getNextProxy(): string {
    if (!this.proxyList.length) return ''
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length
    return this.proxyList[this.currentProxyIndex]
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const proxy = this.getNextProxy()
      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ]
      
      if (proxy) {
        args.push(`--proxy-server=${proxy}`)
      }
      this.browser = await puppeteer.launch({
        headless: true,
        args,
      })
      // Restart browser every hour to prevent memory leaks
      setTimeout(() => this.restartBrowser(), 3600000)
    }
    return this.browser
  }

  private async restartBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async getPage(): Promise<Page> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Block unnecessary resources
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    return page
  }
} 