/**
 * Constants for pricing calculations throughout the application.
 * Centralizes all default values to make them easier to maintain.
 */
export enum PricingConstants {
  // Shipping costs
  DEFAULT_SHIPPING_RATE = 7, // USD per kg
  MINIMUM_SHIPPING_COST = 7, // USD for packages under 1kg
  
  // Fixed fees
  PROCESSING_FEE = 7, // USD
  MOBILITY_FEE = 5, // USD
  
  // Tax rates
  DEFAULT_TAX_PERCENTAGE = 7, // 7%
  IMPORT_TAX_PERCENTAGE = 22, // 22%
  IMPORT_TAX_THRESHOLD = 200, // USD
  
  // Profit margins
  DEFAULT_MARGIN_PERCENTAGE = 10, // 10%
  DEFAULT_MARGIN_PEN = 0, // PEN
  
  // Exchange rate
  DEFAULT_EXCHANGE_RATE = 3.7, // PEN per USD
  
  // Thresholds
  PERCENTAGE_MARGIN_THRESHOLD = 50 // Use percentage margin for products <= $50
}

/**
 * Helper functions for working with pricing constants
 */
export const PricingHelpers = {
  /**
   * Calculate shipping cost based on weight
   */
  calculateShippingCost: (weight: number): number => {
    return !weight || weight < 1 
      ? PricingConstants.MINIMUM_SHIPPING_COST 
      : weight * PricingConstants.DEFAULT_SHIPPING_RATE
  },
  
  /**
   * Determine if import tax applies
   */
  hasImportTax: (basePrice: number): boolean => {
    return basePrice > PricingConstants.IMPORT_TAX_THRESHOLD
  },
  
  /**
   * Calculate import tax amount
   */
  calculateImportTax: (basePrice: number, taxPercentage: number): number => {
    if (!PricingHelpers.hasImportTax(basePrice)) return 0
    
    return (basePrice + (basePrice * (taxPercentage / 100))) * 
      (PricingConstants.IMPORT_TAX_PERCENTAGE / 100)
  },
  
  /**
   * Determine if margin should be percentage-based
   */
  shouldUsePercentageMargin: (basePrice: number): boolean => {
    return basePrice <= PricingConstants.PERCENTAGE_MARGIN_THRESHOLD
  }
}
