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
  
  // Computed actions
  recalculateShipping: () => void
  recalculatePricing: () => void
}

/**
 * Helper function to recalculate request totals based on products
 */
function recalculateRequestTotals(
  products: Product[], 
  shipping: number, 
  exchangeRate: number
) {
  const subTotal = products.reduce((sum: number, product: Product) => sum + (product.price || 0), 0)
  const weight = products.reduce((sum: number, product: Product) => sum + (product.weight || 0), 0)
  const profit = products.reduce((sum: number, product: Product) => sum + (product.profit_amount || 0), 0)
  
  return {
    subTotal,
    weight,
    profit: profit / exchangeRate,
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

  calculations: null,
  finalPriceDisplayCurrency: "PEN" as "PEN" | "USD",
  profit: 0,

  // Actions
  setRequest: (request) => {
    const products = request.products
    const exchangeRate = request.exchange_rate ?? 3.7
    const finalPrice = request.final_price ?? 0
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
    const totals = recalculateRequestTotals(products, totalCosts, exchangeRate)



    set((state) => ({
      request: {
        ...request,
        weight: totals.weight,
        sub_total: totals.subTotal,
        profit: totals.profit,
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
    const totals = recalculateRequestTotals(products, automaticShipping, exchangeRate)
    
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
        profit: totals.profit,
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
      const totals = recalculateRequestTotals(products, automaticShipping, exchangeRate)
      
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
          profit: totals.profit,
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
    const currency = state.request?.currency
    const exchangeRate = state.exchangeRate
    const subTotal = state.request?.sub_total || 0
    const shipping = state.shipping || 0
    
    // Calcular ganancia de productos (en PEN, convertir a USD)
    const productsProfitPEN = state.request?.products?.reduce((sum, p) => sum + (p.profit_amount || 0), 0) ?? 0
    const productsProfitUSD = productsProfitPEN / exchangeRate
    
    // Calcular profit total y profit adicional
    const finalPriceUSD = currency === "USD" ? finalPrice : finalPrice / exchangeRate
    const totalProfit = finalPriceUSD - subTotal - shipping
    const additionalProfit = totalProfit - productsProfitUSD
    
    set({
      request: {
        ...state.request,
        final_price: finalPriceUSD,
        profit: additionalProfit,  // Guardar solo ganancia adicional
        price: finalPriceUSD
      } as PurchaseRequest
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
  setProfit: (profit) => set({ profit }),
  
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
  }
})) 