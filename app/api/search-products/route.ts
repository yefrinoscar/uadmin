// File: app/api/compare-prices/route.js

import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import type { ScrapedProduct } from '@/lib/scraping/types';

// In Next.js 15, we use Route Handlers instead of API Routes
export async function GET(request: { url: string | URL }) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const stores = searchParams.get('stores')?.split(',') || [];
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (stores.length === 0 || stores.length > 3) {
      return NextResponse.json(
        { error: 'Select between 1 and 3 stores' },
        { status: 400 }
      );
    }

    // Execute scraping only for selected stores
    const results = await Promise.all(
      stores.map(store => {
        switch (store) {
          case 'amazon': return scrapeAmazon(query);
          case 'ebay': return scrapeEbay(query);
          case 'jomashop': return scrapeJomashop(query);
          case 'fragancex': return scrapeFragranceX(query);
          case 'sephora': return scrapeSephora(query);
          case 'jessupbeauty': return scrapeJessupBeauty(query);
          case 'rarebeauty': return scrapeRareBeauty(query);
          case 'beautycreations': return scrapeBeautyCreations(query);
          default: return [];
        }
      })
    );

    const allResults = results.flat().sort((a, b) => a.price - b.price);

    return NextResponse.json({
      query,
      results: allResults
    });
    
  } catch (error) {
    console.error('Error comparing prices:', error);
    return NextResponse.json(
      { error: 'Failed to compare prices' },
      { status: 500 }
    );
  }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

async function scrapeWebsite(url: string) {
  const headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  };

  const response = await axios.get(url, { headers });
  return load(response.data);
}

async function scrapeJomashop(query: string): Promise<ScrapedProduct[]> {
  try {
    const response = await axios.post('https://www.jomashop.com/graphql', {
      operationName: 'SearchProducts',
      variables: {
        search: query,
        pageSize: 5,
        currentPage: 1,
        sort: { relevance: 'DESC' }
      },
      query: `
        query SearchProducts($search: String!, $pageSize: Int!, $currentPage: Int!, $sort: ProductAttributeSortInput) {
          products(
            search: $search,
            pageSize: $pageSize,
            currentPage: $currentPage,
            sort: $sort
          ) {
            items {
              name
              sku
              url_key
              price_range {
                minimum_price {
                  regular_price {
                    value
                    currency
                  }
                  final_price {
                    value
                    currency
                  }
                }
              }
              image {
                url
                label
              }
            }
            total_count
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Store': 'default',
        'User-Agent': USER_AGENT,
        'Origin': 'https://www.jomashop.com',
        'Referer': 'https://www.jomashop.com/search'
      }
    });

    if (!response.data.data?.products?.items) {
      throw new Error('Invalid response structure');
    }

    return response.data.data.products.items.map((item: any) => ({
      id: item.sku,
      title: item.name,
      price: item.price_range.minimum_price.final_price.value,
      image: item.image.url,
      source: 'jomashop',
      url: `https://www.jomashop.com/${item.url_key}.html`,
      link: `https://www.jomashop.com/${item.url_key}.html`,
      rawPrice: `$${item.price_range.minimum_price.final_price.value}`
    }));

  } catch (error) {
    console.error('Error scraping Jomashop:', error);
    return [];
  }
}

async function scrapeFragranceX(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://www.fragrancex.com/search/search_results?text=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];

    $('.productBox').slice(0, 5).each((_, el) => {
      const title = $(el).find('.productName').text().trim();
      const priceText = $(el).find('.productPrice').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const link = 'https://www.fragrancex.com' + ($(el).find('.productName a').attr('href') || '');
      const image = $(el).find('.productImage img').attr('src');

      if (title && price) {
        products.push({
          title,
          price,
          link,
          image,
          source: 'fragancex',
          rawPrice: priceText
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping FragranceX:', error);
    return [];
  }
}

async function scrapeSephora(query: string): Promise<ScrapedProduct[]> {
  try {
    // Sephora uses a different approach - they have an API
    const url = `https://www.sephora.com/api/catalog/search?keyword=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    const products: ScrapedProduct[] = response.data.products?.slice(0, 5).map((item: any) => ({
      title: item.displayName,
      price: item.currentSku.listPrice,
      link: `https://www.sephora.com${item.targetUrl}`,
      image: item.heroImage,
      source: 'sephora',
      rawPrice: `$${item.currentSku.listPrice}`,
      rating: item.rating,
      reviews: item.reviews
    })) || [];

    return products;
  } catch (error) {
    console.error('Error scraping Sephora:', error);
    return [];
  }
}

// Add the remaining scraping functions with similar structure
async function scrapeJessupBeauty(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://www.jessupbeauty.com/search?type=product&q=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];

    $('.product-card').slice(0, 5).each((_, el) => {
      const title = $(el).find('.product-card__title').text().trim();
      const priceText = $(el).find('.price__regular .price-item').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const link = 'https://www.jessupbeauty.com' + ($(el).find('.product-card__link').attr('href') || '');
      const image = $(el).find('.product-card__image img').attr('src');

      if (title && price) {
        products.push({
          title,
          price,
          link,
          image,
          source: 'jessupbeauty',
          rawPrice: priceText
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping Jessup Beauty:', error);
    return [];
  }
}

async function scrapeRareBeauty(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://www.rarebeauty.com/search?q=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];

    $('.product-item').slice(0, 5).each((_, el) => {
      const title = $(el).find('.product-item__title').text().trim();
      const priceText = $(el).find('.product-item__price').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const link = 'https://www.rarebeauty.com' + ($(el).find('.product-item__link').attr('href') || '');
      const image = $(el).find('.product-item__image img').attr('src');

      if (title && price) {
        products.push({
          title,
          price,
          link,
          image,
          source: 'rarebeauty',
          rawPrice: priceText
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping Rare Beauty:', error);
    return [];
  }
}

async function scrapeBeautyCreations(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://beautycreationscosmetics.com/search?q=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];

    $('.product-item').slice(0, 5).each((_, el) => {
      const title = $(el).find('.product-title').text().trim();
      const priceText = $(el).find('.price').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const link = 'https://beautycreationscosmetics.com' + ($(el).find('.product-link').attr('href') || '');
      const image = $(el).find('.product-image img').attr('src');

      if (title && price) {
        products.push({
          title,
          price,
          link,
          image,
          source: 'beautycreations',
          rawPrice: priceText
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error scraping Beauty Creations:', error);
    return [];
  }
}

// Update the type for the query parameter
async function scrapeAmazon(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];
    
    $('.s-result-item[data-asin]').each((i, el) => {
      if (i >= 5) return false;
      
      const asin = $(el).attr('data-asin');
      const title = $(el).find('h2 span').text().trim();
      const priceWhole = $(el).find('.a-price-whole').text().trim();
      const priceFraction = $(el).find('.a-price-fraction').text().trim();
      const link = 'https://www.amazon.com' + $(el).find('h2 a').attr('href');
      const image = $(el).find('img.s-image').attr('src');
      
      // Only add if we found a valid title and price
      if (title && (priceWhole || priceFraction)) {
        const priceText = `${priceWhole}${priceFraction ? '.' + priceFraction : ''}`;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        products.push({
          title,
          price,
          image,
          source: 'amazon',
          link: `https://www.amazon.com/dp/${asin}`,
          rawPrice: priceText
        });
      }
    });
    
    return products;
  } catch (error) {
    console.error('Error scraping Amazon:', error);
    return [];
  }
}

async function scrapeEbay(query: string): Promise<ScrapedProduct[]> {
  try {
    const $ = await scrapeWebsite(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`);
    const products: ScrapedProduct[] = [];
    
    $('.s-item__pl-on-bottom').each((i, el) => {
      if (i >= 5) return false;
      
      const itemUrl = $(el).find('a.s-item__link').attr('href') || '';
      const itemId = itemUrl.split('/itm/')[1]?.split('?')[0];
      const title = $(el).find('.s-item__title').text().trim();
      const priceText = $(el).find('.s-item__price').text().trim();
      const image = $(el).find('.s-item__image-img').attr('src');
      
      // Filter out "Shop on eBay" text that sometimes appears in titles
      const cleanTitle = title.replace('Shop on eBay', '').replace('New Listing', '').trim();
      
      // Only add if we found a valid title and price
      if (cleanTitle && priceText && !priceText.includes('to')) {
        // Remove currency symbols and commas, then parse as float
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        products.push({
          title: cleanTitle,
          price,
          image,
          source: 'ebay',
          link: itemUrl,
          rawPrice: priceText
        });
      }
    });
    
    return products;
  } catch (error) {
    console.error('Error scraping eBay:', error);
    return [];
  }
}

// Export all scraping functions
export {
  scrapeAmazon,
  scrapeEbay,
  scrapeJomashop,
  scrapeFragranceX,
  scrapeSephora,
  scrapeJessupBeauty,
  scrapeRareBeauty,
  scrapeBeautyCreations
};