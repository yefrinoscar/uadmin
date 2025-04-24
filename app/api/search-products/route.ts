// File: app/api/compare-prices/route.js

import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';

// Define the ScrapedProduct type directly in this file
export type ScrapedProduct = {
  title: string
  price: number
  link: string
  image: string | undefined
  source: string
  rawPrice: string
  rating?: number
  reviews?: number
}

// In Next.js 15, we use Route Handlers instead of API Routes
export async function GET(request: Request) {
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
      stores.map((store): Promise<ScrapedProduct[]> => {
        switch (store) {
          case 'amazon': return scrapeAmazon(query);
          case 'ebay': return scrapeEbay(query);
          case 'jomashop': return scrapeJomashop(query);
          case 'fragancex': return scrapeFragranceX(query);
          case 'sephora': return scrapeSephora(query);
          case 'jessupbeauty': return scrapeJessupBeauty(query);
          case 'rarebeauty': return scrapeRareBeauty(query);
          case 'beautycreations': return scrapeBeautyCreations(query);
          default: return Promise.resolve([]);
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
  // For testing purposes, return mock data instead of actually scraping Jomashop
  try {
    console.log(`[MOCK] Searching Jomashop for: ${query}`);
    return [
      {
        title: `Jomashop: ${query} - Luxury Watch Automatic Movement`,
        price: 1299.99,
        link: 'https://www.jomashop.com/sample-product-1',
        image: 'https://www.jomashop.com/media/catalog/product/cache/bd5cfca3fd50588c189db3ff22b4cbc9/o/m/omega-speedmaster-racing-automatic-chronograph-men_s-watch-32630405001001.jpg',
        source: 'jomashop',
        rawPrice: '$1,299.99',
        rating: 4.9,
        reviews: 156
      },
      {
        title: `Jomashop: ${query} - Designer Sunglasses Polarized`,
        price: 149.00,
        link: 'https://www.jomashop.com/sample-product-2',
        image: 'https://www.jomashop.com/media/catalog/product/cache/1/small_image/9df78eab33525d08d6e5fb8d27136e95/r/a/ray-ban-rb3025-aviator-gold-frame-crystal-brown-polarized-lenses-58mm-sunglasses-0rb3025-001-57-58_1.jpg',
        source: 'jomashop',
        rawPrice: '$149.00',
        rating: 4.6,
        reviews: 89
      },
      {
        title: `Jomashop: ${query} - Luxury Pen Limited Edition`,
        price: 229.50,
        link: 'https://www.jomashop.com/sample-product-3',
        image: 'https://www.jomashop.com/media/catalog/product/m/o/montblanc-starwalker-black-mystery-fineliner-pen-105656_1.jpg',
        source: 'jomashop',
        rawPrice: '$229.50',
        rating: 4.7,
        reviews: 43
      }
    ];
  } catch (error) {
    console.error('Error in mock Jomashop scraping:', error);
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
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // For testing purposes, return mock data instead of actually scraping Amazon
  try {
    console.log(`[MOCK] Searching Amazon for: ${query}`);
    return [
      {
        title: `Amazon: ${query} - Wireless Headphones with Noise Cancellation`,
        price: 129.99,
        link: 'https://www.amazon.com/sample-product-1',
        image: 'https://m.media-amazon.com/images/I/71+2H5MsaPL._AC_UL600_FMwebp_QL65_.jpg',
        source: 'amazon',
        rawPrice: '$129.99',
        rating: 4.5,
        reviews: 1287
      },
      {
        title: `Amazon: ${query} - Smartphone 128GB Unlocked`,
        price: 399.99,
        link: 'https://www.amazon.com/sample-product-2',
        image: 'https://m.media-amazon.com/images/I/71w3oJ7aWyL._AC_UY436_FMwebp_QL65_.jpg',
        source: 'amazon',
        rawPrice: '$399.99',
        rating: 4.3,
        reviews: 3452
      },
      {
        title: `Amazon: ${query} - Smart Watch with Fitness Tracker`,
        price: 89.95,
        link: 'https://www.amazon.com/sample-product-3',
        image: 'https://m.media-amazon.com/images/I/71jiGaztijL._AC_UL600_FMwebp_QL65_.jpg',
        source: 'amazon',
        rawPrice: '$89.95',
        rating: 4.2,
        reviews: 987
      }
    ];
  } catch (error) {
    console.error('Error in mock Amazon scraping:', error);
    return [];
  }
}

async function scrapeEbay(query: string): Promise<ScrapedProduct[]> {
  // For testing purposes, return mock data instead of actually scraping eBay
  try {
    console.log(`[MOCK] Searching eBay for: ${query}`);
    return [
      {
        title: `eBay: ${query} - Vintage Camera Collection`,
        price: 249.50,
        link: 'https://www.ebay.com/sample-item-1',
        image: 'https://i.ebayimg.com/images/g/TN4AAOSwefJiMCiJ/s-l500.jpg',
        source: 'ebay',
        rawPrice: '$249.50',
        rating: 4.8,
        reviews: 56
      },
      {
        title: `eBay: ${query} - Collectible Action Figure`,
        price: 34.99,
        link: 'https://www.ebay.com/sample-item-2',
        image: 'https://i.ebayimg.com/images/g/iC4AAOSwk6xi-Zil/s-l500.jpg',
        source: 'ebay',
        rawPrice: '$34.99',
        rating: 4.5,
        reviews: 23
      },
      {
        title: `eBay: ${query} - Retro Gaming Console`,
        price: 189.00,
        link: 'https://www.ebay.com/sample-item-3',
        image: 'https://i.ebayimg.com/images/g/lLEAAOSwt8ljB9oC/s-l500.jpg',
        source: 'ebay',
        rawPrice: '$189.00',
        rating: 4.7,
        reviews: 112
      }
    ];
  } catch (error) {
    console.error('Error in mock eBay scraping:', error);
    return [];
  }
}