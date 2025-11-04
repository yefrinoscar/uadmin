"use client"

import { useState, useEffect, useCallback } from "react"
import { PricingConstants } from "@/config/pricing-constants"
import { 
  calculatePricingDetails, 
  type PricingCalculationInput, 
  type PricingCalculationResult 
} from "@/utils/calculations"

export type PricingInput = {
  basePrice: number
  weight: number
  exchangeRate?: number
  initialMarginPEN?: number
  initialTaxPercentage?: number
}

export type PricingOutput = PricingCalculationResult & {
  // State setters
  setMarginPEN: (value: number) => void
}

export function usePricingCalculations({
  basePrice = 0,
  weight = 0,
  exchangeRate,
  initialMarginPEN = PricingConstants.DEFAULT_MARGIN_PEN,
  initialTaxPercentage = PricingConstants.DEFAULT_TAX_PERCENTAGE
}: PricingInput): PricingOutput {
  // Core state
  const [marginPEN, setMarginPEN] = useState(initialMarginPEN)

  // Use the utility function for all calculations
  const calculationResult = calculatePricingDetails({
    basePrice,
    weight,
    exchangeRate,
    marginPEN,
    taxPercentage: initialTaxPercentage
  })

  return {
    ...calculationResult,
    marginPEN, // Use local state value
    setMarginPEN
  }
}
