import { Page } from 'puppeteer'
import { BaseScraper } from './base-scraper'

export class AmazonScraper extends BaseScraper {
  protected async scrapeProductDetails(page: Page, query: string): Promise<any[]> {
    await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle0'
    })

    return page.evaluate(() => {
      const products: { id: string; title: string | undefined; price: number; image: string | null | undefined; source: string; url: string; rating: number; reviews: number }[] = []
      const items = document.querySelectorAll('.s-result-item[data-asin]:not([data-asin=""])')
      
      items.forEach((item) => {
        const asin = item.getAttribute('data-asin')
        const titleElement = item.querySelector('h2 span')
        const priceElement = item.querySelector('.a-price .a-offscreen')
        const imageElement = item.querySelector('img.s-image')
        const ratingElement = item.querySelector('.a-icon-star-small .a-icon-alt')
        const reviewsElement = item.querySelector('.a-size-base.s-underline-text')

        if (asin && titleElement && priceElement) {
          const price = parseFloat(priceElement.textContent?.replace(/[^0-9.]/g, '') || '0')
          const rating = parseFloat(ratingElement?.textContent?.match(/\d+(\.\d+)?/)?.[0] || '0')
          const reviews = parseInt(reviewsElement?.textContent?.replace(/[^0-9]/g, '') || '0')

          products.push({
            id: asin,
            title: titleElement.textContent?.trim(),
            price,
            image: imageElement?.getAttribute('src'),
            source: 'amazon',
            url: `https://www.amazon.com/dp/${asin}`,
            rating,
            reviews
          })
        }
      })

      return products.slice(0, 5)
    })
  }
} 