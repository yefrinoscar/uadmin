import axios from 'axios'
import { load } from 'cheerio'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

// Rotate between different user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
]

// Rotate between different proxy servers (you should use your own proxy servers)
const PROXY_SERVERS = [
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080',
]

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const proxy = getRandomItem(PROXY_SERVERS)
      const userAgent = getRandomItem(USER_AGENTS)
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        httpsAgent: new HttpsProxyAgent(proxy),
        httpAgent: new HttpProxyAgent(proxy),
        timeout: 10000,
      })
      
      return response.data
    } catch (error) {
      lastError = error as Error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
    }
  }
  
  throw lastError
}

export async function searchAmazon(query: string) {
  try {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`
    const html = await fetchWithRetry(url)
    const $ = load(html)
    
    const products: { id: string; title: string; price: number; image: string; source: "amazon"; url: string; rating: number; reviews: number }[] = []
    
    $('.s-result-item[data-asin]').each((_, element) => {
      const $el = $(element)
      const asin = $el.attr('data-asin')
      
      if (!asin) return
      
      const title = $el.find('h2 span').text().trim()
      const priceText = $el.find('.a-price-whole').first().text().trim()
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
      const image = $el.find('img.s-image').attr('src') || ''
      const ratingText = $el.find('.a-icon-star-small .a-icon-alt').text()
      const rating = parseFloat(ratingText) || 0
      const reviewsText = $el.find('.a-size-base.s-underline-text').text()
      const reviews = parseInt(reviewsText.replace(/[^0-9]/g, '')) || 0
      
      if (title && price) {
        products.push({
          id: asin,
          title,
          price,
          image,
          source: 'amazon' as const,
          url: `https://www.amazon.com/dp/${asin}`,
          rating,
          reviews,
        })
      }
    })
    
    return products.slice(0, 5)
  } catch (error) {
    console.error('Amazon scraping error:', error)
    return []
  }
}

export async function searchEbay(query: string) {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15` // _sop=15 sorts by price + shipping: lowest first
    const html = await fetchWithRetry(url)
    const $ = load(html)
    
    const products: { id: string; title: string; price: number; image: string; source: "ebay"; url: string; rating: number; reviews: number }[] = []
    
    $('.s-item__wrapper').each((_, element) => {
      const $el = $(element)
      
      const title = $el.find('.s-item__title').text().trim()
      const priceText = $el.find('.s-item__price').text().trim()
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
      const image = $el.find('.s-item__image-img').attr('src') || ''
      const url = $el.find('.s-item__link').attr('href') || ''
      const id = url.split('itm/')[1]?.split('?')[0] || ''
      
      // Get seller info
      const sellerInfo = $el.find('.s-item__seller-info')
      const feedbackText = sellerInfo.find('.s-item__seller-info-text').text()
      const feedbackMatch = feedbackText.match(/(\d+(\.\d+)?)\s*%.*?(\d+)/)
      const rating = feedbackMatch ? parseFloat(feedbackMatch[1]) / 20 : 0 // Convert percentage to 5-star scale
      const reviews = feedbackMatch ? parseInt(feedbackMatch[3]) : 0
      
      if (title && price && id) {
        products.push({
          id,
          title,
          price,
          image,
          source: 'ebay' as const,
          url,
          rating,
          reviews,
        })
      }
    })
    
    return products.slice(0, 5)
  } catch (error) {
    console.error('eBay scraping error:', error)
    return []
  }
} 