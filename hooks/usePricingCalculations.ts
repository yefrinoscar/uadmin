"use client"

import { useState, useEffect, useCallback } from "react"
import { PricingConstants, PricingHelpers } from "@/config/pricing-constants"

export type PricingInput = {
  basePrice: number
  weight: number
  exchangeRate?: number
  initialMarginPEN?: number
  initialTaxPercentage?: number
}

export type PricingOutput = {
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
  
  // State values
  exchangeRate: number
  taxPercentage: number
  marginPEN: number
  
  // State setters
  setMarginPEN: (value: number) => void
}

export function usePricingCalculations({
  basePrice = 0,
  weight = 0,
  initialMarginPEN = PricingConstants.DEFAULT_MARGIN_PEN,
  initialTaxPercentage = PricingConstants.DEFAULT_TAX_PERCENTAGE
}: PricingInput): PricingOutput {
  // Core state
  const [marginPEN, setMarginPEN] = useState(initialMarginPEN)

  // Calculate shipping costs and fixed fees using constants
  const processing = PricingConstants.PROCESSING_FEE
  const mobility = PricingConstants.MOBILITY_FEE
  const shipping = PricingHelpers.calculateShippingCost(weight)
  const totalCosts = shipping + processing + mobility
  const taxPercentage = initialTaxPercentage ?? PricingConstants.DEFAULT_TAX_PERCENTAGE 
  const exchangeRate = PricingConstants.DEFAULT_EXCHANGE_RATE

  // Calculate import tax using helpers
  const hasImportTax = PricingHelpers.hasImportTax(basePrice)
  const importTax = PricingHelpers.calculateImportTax(basePrice, taxPercentage)

  // Calculate base price with tax
  const taxAmount =  basePrice * (taxPercentage / 100)
  
  // No percentage margin calculation needed

  // Calculate total price in USD
  const calculatePrice = useCallback(() => {
    return basePrice + 
           shipping + 
           taxAmount + 
           processing + 
           mobility + 
           (hasImportTax ? importTax : 0)
  }, [
    basePrice, 
    shipping, 
    taxAmount, 
    processing, 
    mobility, 
    hasImportTax, 
    importTax
  ])

  // Calculate total with PEN margin
  const calculateTotalWithPENMargin = useCallback(() => {
    const usdTotal = calculatePrice()
    return usdTotal + (marginPEN / exchangeRate)
  }, [calculatePrice, marginPEN, exchangeRate])

  // Calculate final values
  console.log("calculatePrice", calculatePrice());
  
  const totalUSD = calculatePrice()
  const totalPEN = totalUSD * exchangeRate
  const totalWithPENMargin = calculateTotalWithPENMargin()
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
    
    // State values
    exchangeRate,
    taxPercentage,
    marginPEN,
    
    // State setters
    setMarginPEN
  }
}
