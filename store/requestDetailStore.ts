"use client"

import { create } from "zustand"
import { toast } from "sonner"
import { Product, PurchaseRequest } from "@/trpc/api/routers/requests"
import { 
  calculatePricingDetails, 
  calculateTotalShippingCost,
  type PricingCalculationResult 
} from "@/utils/calculations"

interface Amount {
  PEN: number;
  USD: number;
}

interface RequestDetailState {
  // Data
  request: PurchaseRequest | null
  products: Product[]
  shipping: number
  weight: number
  subTotal: number
  profit: number
  total: number
  finalPrice: Amount
  exchangeRate: number
  isManuallyModifiedPrice: boolean

  calculations: PricingCalculationResult | null
  finalPriceDisplayCurrency: "PEN" | "USD"

  // Actions
  setRequest: (request: any) => void
  setCurrency: (currency: "PEN" | "USD") => void
  setProducts: (products: Product[]) => void
  removeProduct: (productId: string) => void
  setShipping: (shipping: number) => void
  setTotal: (total: number) => void
  setCalculations: (calculations: PricingCalculationResult | null) => void
  setWeight: (weight: number) => void
  setExchangeRate: (rate: number) => void
  setProfit: (profit: number) => void
  setFinalPrice: (finalPrice: number) => void
  setFinalPriceValue: (finalPriceUSD: number) => void
  
  // Computed actions
  recalculateShipping: () => void
  recalculatePricing: () => void
  
  // Computed getters
  getCalculatedPricing: () => {
    subTotal: number
    weight: number
    shippingByWeight: number
    processingFee: number
    handlingFee: number
    totalShippingCost: number
    totalCostsUSD: number
    productsProfitUSD: number
    additionalProfitUSD: number
    totalProfitUSD: number
    calculatedPriceUSD: number
    finalPriceUSD: number
    exchangeRate: number
  }
}

/**
 * Helper function to recalculate request totals based on products
 */
function recalculateRequestTotals(
  products: Product[], 
  shipping: number, 
  exchangeRate: number,
  profit: number
) {
  const subTotal = products.reduce((sum: number, product: Product) => sum + (product.price || 0), 0)
  const weight = products.reduce((sum: number, product: Product) => sum + (product.weight || 0), 0)
  const productsProfit = products.reduce((sum: number, product: Product) => sum + (product.profit_amount || 0), 0)
  
  return {
    subTotal,
    weight,
    productsProfit: productsProfit / exchangeRate,
    totalProfit: productsProfit / exchangeRate + profit,
    price: subTotal + shipping + (profit / exchangeRate),
    final_price: subTotal + shipping + (profit / exchangeRate)
  }
}

export const useRequestDetailStore = create<RequestDetailState>((set, get) => ({
  // Initial state
  request: null,
  products: [],
  subTotal: 0,
  shipping: 0,
  total: 0,
  exchangeRate: 3.7,
  weight: 0,
  finalPrice: {
    PEN: 0,
    USD: 0
  },
  isManuallyModifiedPrice: false,

  calculations: null,
  finalPriceDisplayCurrency: "PEN" as "PEN" | "USD",
  profit: 0,

  // Actions
  setRequest: (request) => {
    const products = request.products
    const exchangeRate = request.exchange_rate ?? 3.7
    const subTotal = products.reduce((sum: number, product: Product) => sum + (product.price || 0), 0)
    const weight = products.reduce((sum: number, product: Product) => sum + (product.weight || 0), 0)

    // Calculate comprehensive pricing details
    const { totalCosts } = calculatePricingDetails({
      basePrice: subTotal,
      weight: weight,
      exchangeRate,
      marginPEN: 0, // No additional margin for request calculations
      taxPercentage: 0 // Tax handled separately in requests
    })

    // Recalculate totals
    const totals = recalculateRequestTotals(products, totalCosts, exchangeRate, request.profit ?? 0)
    
    // Si no hay final_price o es 0, calcularlo
    const productsProfitPEN = products.reduce((sum: number, product: Product) => sum + (product.profit_amount || 0), 0)
    const productsProfitUSD = productsProfitPEN / exchangeRate
    const additionalProfitUSD = request.profit ?? 0
    const calculatedFinalPrice = subTotal + totalCosts + productsProfitUSD + additionalProfitUSD
    const finalPrice = (request.final_price && request.final_price > 0) ? request.final_price : calculatedFinalPrice

    set((state) => ({
      request: {
        ...request,
        weight: totals.weight,
        sub_total: totals.subTotal,
        productsProfit: totals.productsProfit,
        totalProfit: totals.totalProfit,
        price: totals.price,
        final_price: finalPrice,
        exchange_rate: exchangeRate
      },
      shipping: totalCosts
    }))
  },

  setProducts: (products) => {
    const state = get()
    const exchangeRate = state.request?.exchange_rate ?? 3.7
    
    // Automatically recalculate shipping based on new products
    const automaticShipping = calculateTotalShippingCost(products)
    
    // Recalculate totals
    const totals = recalculateRequestTotals(products, automaticShipping, exchangeRate, state.request?.profit ?? 0)
    
    // Calculate comprehensive pricing details
    const pricingCalculations = calculatePricingDetails({
      basePrice: totals.subTotal,
      weight: totals.weight,
      exchangeRate,
      marginPEN: 0,
      taxPercentage: 0
    })
       
    set((state) => ({
      request: {
        ...state.request,
        weight: totals.weight,
        sub_total: totals.subTotal,
        productsProfit: totals.productsProfit,
        totalProfit: totals.totalProfit,
        price: totals.price,
        final_price: totals.final_price,
        exchange_rate: exchangeRate,
        products
      } as PurchaseRequest,
      shipping: automaticShipping,
      calculations: pricingCalculations
    }))
  },

  removeProduct: (productId) => {
    set((state) => {
      const products = state.request?.products.filter(product => product.id !== productId) ?? []
      const exchangeRate = state.request?.exchange_rate ?? 3.7
      
      // Automatically recalculate shipping based on remaining products
      const automaticShipping = calculateTotalShippingCost(products)
      
      // Recalculate totals
      const totals = recalculateRequestTotals(products, automaticShipping, exchangeRate, state.request?.profit ?? 0)
      
      // Calculate comprehensive pricing details
      const pricingCalculations = calculatePricingDetails({
        basePrice: totals.subTotal,
        weight: totals.weight,
        exchangeRate,
        marginPEN: 0,
        taxPercentage: 0
      })
      
      return {
        request: {
          ...state.request,
          weight: totals.weight,
          sub_total: totals.subTotal,
          productsProfit: totals.productsProfit,
          totalProfit: totals.totalProfit,
          price: totals.price,
          final_price: totals.final_price,
          exchange_rate: exchangeRate,
          products
        } as PurchaseRequest,
        shipping: automaticShipping,
        calculations: pricingCalculations
      }
    })
    toast.success("Producto eliminado")
  },

  setShipping: (shipping) => {
    set((state) => ({
      shipping,
      total: state.subTotal + state.profit + shipping
    }))
  },

  setTotal: (total) => set({ total }),

  setFinalPrice: (finalPrice: number) => {
    const state = get()
    const exchangeRate = state.request?.exchange_rate ?? 3.7
    const subTotal = state.request?.sub_total || 0
    const shipping = state.shipping || 0
    
    // Calcular ganancia de productos (en PEN, convertir a USD)
    const productsProfitPEN = state.request?.products?.reduce((sum, p) => sum + (p.profit_amount || 0), 0) ?? 0
    const productsProfitUSD = productsProfitPEN / exchangeRate
    
    // El precio final siempre viene en USD
    const finalPriceUSD = finalPrice
    
    // Validar que el precio final no sea menor a los costos totales
    const totalCostsUSD = subTotal + shipping
    
    if (finalPriceUSD < totalCostsUSD) {
      // Volver al precio calculado
      const calculatedPrice = totalCostsUSD + productsProfitUSD
      toast.error(`El precio final no puede ser menor a los costos totales ($${totalCostsUSD.toFixed(2)})`)
      
      set({
        request: {
          ...state.request,
          final_price: calculatedPrice,
          profit: 0,  // Reset profit adicional
          price: calculatedPrice
        } as PurchaseRequest
      })
      return
    }
    
    // Calcular profit total y profit adicional
    const totalProfit = finalPriceUSD - subTotal - shipping
    const additionalProfit = totalProfit - productsProfitUSD
    
    set({
      request: {
        ...state.request,
        final_price: finalPriceUSD,
        profit: additionalProfit,  // Guardar solo ganancia adicional
        price: finalPriceUSD
      } as PurchaseRequest,
      isManuallyModifiedPrice: true  // Marcar como modificación manual
    })
  },

  setCurrency: (currency: "PEN" | "USD") => {
    set((state) => ({
      request: {
        ...state.request,
        currency
      } as PurchaseRequest
    }))
  },

  // UI state
  setCalculations: (calculations) => set({ calculations }),
  setWeight: (weight) => set({ weight }),
  setExchangeRate: (rate) => set((state) => ({
    exchangeRate: rate,
    request: {
      ...state.request,
      exchange_rate: rate
    } as PurchaseRequest
  })),
  setProfit: (profit) => {
    const state = get()
    const subTotal = state.request?.sub_total ?? 0
    const shipping = state.shipping ?? 0
    const productsProfitPEN = state.request?.products?.reduce((sum, p) => sum + (p.profit_amount || 0), 0) ?? 0
    const exchangeRate = state.request?.exchange_rate ?? 3.7
    const productsProfitUSD = productsProfitPEN / exchangeRate
    
    // Calcular nuevo precio final: costos + ganancia de productos + ganancia adicional
    const newFinalPrice = subTotal + shipping + productsProfitUSD + profit
    
    set({
      profit,
      request: {
        ...state.request,
        profit,
        final_price: newFinalPrice,
        price: newFinalPrice
      } as PurchaseRequest,
      isManuallyModifiedPrice: false  // Reset flag cuando se recalcula automáticamente
    })
  },
  
  setFinalPriceValue: (finalPriceUSD) => set((state) => ({
    request: state.request ? {
      ...state.request,
      final_price: finalPriceUSD
    } : state.request
  })),
  
  // Computed actions
  recalculateShipping: () => {
    const state = get()
    if (!state.request?.products) return
    
    const automaticShipping = calculateTotalShippingCost(state.request.products)
    set({ shipping: automaticShipping })
  },
  
  recalculatePricing: () => {
    const state = get()
    if (!state.request) return
    
    const pricingCalculations = calculatePricingDetails({
      basePrice: state.request.sub_total || 0,
      weight: state.request.weight || 0,
      exchangeRate: state.request.exchange_rate || 3.7,
      marginPEN: 0,
      taxPercentage: 0
    })
    
    set({ calculations: pricingCalculations })
  },
  
  // Computed getter - returns all calculated pricing values
  getCalculatedPricing: () => {
    const state = get()
    const request = state.request
    
    // Constants
    const SHIPPING_PER_KG = 7
    const PROCESSING_FEE = 7
    const HANDLING_FEE = 5
    
    // Base values
    const subTotal = request?.sub_total ?? 0
    const weight = request?.weight ?? 0
    const exchangeRate = request?.exchange_rate ?? 3.7
    
    // Shipping calculation
    const shippingByWeight = weight * SHIPPING_PER_KG
    const totalShippingCost = shippingByWeight + PROCESSING_FEE + HANDLING_FEE
    
    // Costs
    const totalCostsUSD = subTotal + totalShippingCost
    
    // Profit calculation
    const productsProfitPEN = request?.products?.reduce((sum, p) => sum + (p.profit_amount || 0), 0) ?? 0
    const productsProfitUSD = productsProfitPEN / exchangeRate
    const additionalProfitUSD = request?.profit ?? 0
    const totalProfitUSD = productsProfitUSD + additionalProfitUSD
    
    // Prices
    const calculatedPriceUSD = totalCostsUSD + productsProfitUSD
    const finalPriceUSD = request?.final_price ?? calculatedPriceUSD
    
    return {
      subTotal,
      weight,
      shippingByWeight,
      processingFee: PROCESSING_FEE,
      handlingFee: HANDLING_FEE,
      totalShippingCost,
      totalCostsUSD,
      productsProfitUSD,
      additionalProfitUSD,
      totalProfitUSD,
      calculatedPriceUSD,
      finalPriceUSD,
      exchangeRate
    }
  }
})) 