import { createHmac } from 'crypto'

type AmazonSearchParams = {
  Keywords: string
  SearchIndex?: string
  Resources?: string[]
  Marketplace?: string
}

export async function searchAmazon(query: string) {
  const endpoint = 'webservices.amazon.com'
  const uri = '/paapi5/searchitems'
  const region = process.env.AMAZON_REGION || 'us-east-1'
  const accessKey = process.env.AMAZON_ACCESS_KEY!
  const secretKey = process.env.AMAZON_SECRET_KEY!
  const partnerTag = process.env.AMAZON_PARTNER_TAG!

  const params: AmazonSearchParams = {
    Keywords: query,
    SearchIndex: 'All',
    Resources: [
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'Images.Primary.Medium',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating'
    ],
    Marketplace: 'www.amazon.com'
  }

  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    'host': endpoint,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
  }

  const canonicalRequest = [
    'POST',
    uri,
    '',
    Object.entries(headers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k.toLowerCase()}:${v}`)
      .join('\n'),
    '',
    Object.keys(headers)
      .sort()
      .map(k => k.toLowerCase())
      .join(';'),
    createHmac('sha256', JSON.stringify(params)).digest('hex')
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`,
    createHmac('sha256', canonicalRequest).digest('hex')
  ].join('\n')

  const signature = createHmac('sha256',
    `AWS4${secretKey}/${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`
  ).update(stringToSign).digest('hex')

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`,
    `SignedHeaders=${Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')}`,
    `Signature=${signature}`
  ].join(', ')

  try {
    const response = await fetch(`https://${endpoint}${uri}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': authorization
      },
      body: JSON.stringify({
        ...params,
        PartnerTag: partnerTag,
        PartnerType: 'Associates'
      })
    })

    const data = await response.json()
    
    return data.ItemsResult.Items.map((item: any) => ({
      id: item.ASIN,
      title: item.ItemInfo.Title.DisplayValue,
      price: item.Offers.Listings[0].Price.Amount,
      image: item.Images.Primary.Medium.URL,
      source: 'amazon' as const,
      url: item.DetailPageURL,
      rating: item.CustomerReviews?.StarRating?.Value || 0,
      reviews: item.CustomerReviews?.Count || 0
    })).slice(0, 5)
  } catch (error) {
    console.error('Amazon API error:', error)
    return []
  }
} 