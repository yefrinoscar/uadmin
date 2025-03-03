import { Page } from 'puppeteer'
import { BaseScraper } from './base-scraper'

export class EbayScraper extends BaseScraper {
  protected async scrapeProductDetails(page: Page, query: string): Promise<any[]> {
    await page.goto(
      `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15`,
      { waitUntil: 'networkidle0' }
    )

    return page.evaluate(() => {
      const products: { id: string; title: string | undefined; price: number; image: string | null | undefined; source: string; url: string; rating: number; reviews: number }[] = []
      const items = document.querySelectorAll('.s-item__wrapper')
      
      items.forEach((item) => {
        const titleElement = item.querySelector('.s-item__title')
        const priceElement = item.querySelector('.s-item__price')
        const imageElement = item.querySelector('.s-item__image-img')
        const linkElement = item.querySelector('.s-item__link')
        const sellerElement = item.querySelector('.s-item__seller-info-text')

        if (titleElement && priceElement && linkElement) {
          const url = linkElement.getAttribute('href') || ''
          const id = url.split('itm/')[1]?.split('?')[0]
          const price = parseFloat(priceElement.textContent?.replace(/[^0-9.]/g, '') || '0')
          
          const feedbackMatch = sellerElement?.textContent?.match(/(\d+(\.\d+)?)\s*%.*?(\d+)/)
          const rating = feedbackMatch ? parseFloat(feedbackMatch[1]) / 20 : 0
          const reviews = feedbackMatch ? parseInt(feedbackMatch[3]) : 0

          products.push({
            id,
            title: titleElement.textContent?.trim(),
            price,
            image: imageElement?.getAttribute('src'),
            source: 'ebay',
            url,
            rating,
            reviews
          })
        }
      })

      return products.slice(0, 5)
    })
  }
} 