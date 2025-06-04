import { ProformaItem } from '@/types/proforma'
import { PricingConstants, PricingHelpers } from '@/config/pricing-constants'

export const calculateTotals = (items: ProformaItem[], includeIGV: boolean) => {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  const tax = includeIGV ? subtotal * 0.18 : 0
  const total = subtotal + tax

  return {
    subtotal,
    tax,
    total,
  }
}

/**
 * Input parameters for pricing calculations
 */
export interface PricingCalculationInput {
  basePrice: number
  weight: number
  exchangeRate?: number
  marginPEN?: number
  taxPercentage?: number
}

/**
 * Complete pricing calculation result
 */
export interface PricingCalculationResult {
  // Core calculations
  totalUSD: number
  totalPEN: number
  shipping: number
  processing: number
  mobility: number
  totalCosts: number
  
  // Tax calculations
  taxAmount: number
  importTax: number
  hasImportTax: boolean
  
  // Profit calculations
  totalWithPENMargin: number
  totalPENWithMargin: number
  
  // Configuration values
  exchangeRate: number
  taxPercentage: number
  marginPEN: number
}

/**
 * Comprehensive pricing calculation utility function
 * Can be used in stores, components, and server-side logic
 */
export function calculatePricingDetails({
  basePrice = 0,
  weight = 0,
  exchangeRate = PricingConstants.DEFAULT_EXCHANGE_RATE,
  marginPEN = PricingConstants.DEFAULT_MARGIN_PEN,
  taxPercentage = PricingConstants.DEFAULT_TAX_PERCENTAGE
}: PricingCalculationInput): PricingCalculationResult {
  // Calculate shipping costs and fixed fees using constants
  const processing = PricingConstants.PROCESSING_FEE
  const mobility = PricingConstants.MOBILITY_FEE
  const shipping = PricingHelpers.calculateShippingCost(weight)
  const totalCosts = shipping + processing + mobility

  // Calculate import tax using helpers
  const hasImportTax = PricingHelpers.hasImportTax(basePrice)
  const importTax = PricingHelpers.calculateImportTax(basePrice, taxPercentage)

  // Calculate base price with tax
  const taxAmount = basePrice * (taxPercentage / 100)

  // Calculate total price in USD
  const totalUSD = basePrice + 
                   shipping + 
                   taxAmount + 
                   processing + 
                   mobility + 
                   (hasImportTax ? importTax : 0)

  // Calculate total with PEN margin
  const totalWithPENMargin = totalUSD + (marginPEN / exchangeRate)

  // Calculate PEN values
  const totalPEN = totalUSD * exchangeRate
  const totalPENWithMargin = totalPEN + marginPEN

  return {
    // Core calculations
    totalUSD,
    totalPEN,
    totalCosts,
    processing,
    mobility,
    shipping,
    
    // Tax calculations
    taxAmount,
    importTax,
    hasImportTax,
    
    // Profit calculations
    totalWithPENMargin,
    totalPENWithMargin,
    
    // Configuration values
    exchangeRate,
    taxPercentage,
    marginPEN
  }
}

/**
 * Simple shipping cost calculator utility
 * Perfect for quick shipping cost calculations in stores
 */
export function calculateShippingCost(weight: number): number {
  return PricingHelpers.calculateShippingCost(weight)
}

/**
 * Calculate shipping costs for multiple products
 */
export function calculateTotalShippingCost(products: Array<{ weight?: number }>): number {
  const totalWeight = products.reduce((sum, product) => sum + (product.weight || 0), 0)
  return calculateShippingCost(totalWeight)
} 