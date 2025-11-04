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