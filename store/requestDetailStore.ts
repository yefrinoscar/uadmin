"use client"

import { create } from "zustand"
import { toast } from "sonner"
import { Product, PurchaseRequest } from "@/trpc/api/routers/requests"

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

  calculations: any
  finalPriceDisplayCurrency: "PEN" | "USD"

  // Actions
  setRequest: (request: any) => void
  setCurrency: (currency: "PEN" | "USD") => void
  setProducts: (products: Product[]) => void
  removeProduct: (productId: string) => void
  setShipping: (shipping: number) => void
  setTotal: (total: number) => void
  setCalculations: (calculations: any) => void
  setWeight: (weight: number) => void
  setExchangeRate: (rate: number) => void
  setProfit: (profit: number) => void
  setFinalPrice: (finalPrice: number) => void
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
    const subTotal = products.reduce((sum: number, product: Product) => sum + (product.price || 0), 0)
    const weight = products.reduce((sum: number, product: Product) => sum + (product.weight || 0), 0)
    const profit = products.reduce((sum: number, product: Product) => sum + (product.profit_amount || 0), 0)
    const exchange_rate = request.exchange_rate ?? 3.7
    const final_price = request.final_price ?? 0

    set((state) => ({
      request: {
        ...request,
        weight,
        sub_total: subTotal,
        profit: profit / exchange_rate,
        price: request.price ?? subTotal + state.shipping + profit,
        final_price,
        exchange_rate: exchange_rate
      }
    }))
  },

  setProducts: (products) => {
    // Recalculate totals when products change
    const subTotal = products.reduce((sum: number, product: Product) => sum + (product.price || 0), 0)
    const weight = products.reduce((sum: number, product: Product) => sum + (product.weight || 0), 0)
    const profit = products.reduce((sum: number, product: Product) => sum + (product.profit_amount || 0), 0)
       
    set((state) => ({
      request: {
        ...state.request,
        weight,
        sub_total: subTotal,
        profit: profit / (state.request?.exchange_rate ?? 3.7),
        price: subTotal + state.shipping + profit,
        final_price: subTotal + state.shipping + profit,
        exchange_rate: state.request?.exchange_rate,
        products
      } as PurchaseRequest
    }))
  },

  removeProduct: (productId) => {
    set((state) => {
      const products = state.request?.products.filter(product => product.id !== productId) ?? []
      const subTotal = products.reduce((sum: number, p: Product) => sum + (p.price || 0), 0)
      const weight = products.reduce((sum: number, p: Product) => sum + (p.weight || 0), 0)
      const profit = products.reduce((sum: number, p: Product) => sum + (p.profit_amount || 0), 0)
      return {
        request: {
          ...state.request,
          weight,
          sub_total: subTotal,
          profit: profit / (state.request?.exchange_rate ?? 3.7),
          price: subTotal + state.shipping + profit,
          final_price: subTotal + state.shipping + profit,
          exchange_rate: state.request?.exchange_rate,
          products
        } as PurchaseRequest
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
    const currency = get().request?.currency
    const exchangeRate = get().exchangeRate
    set((state) => ({
      request: {
        ...state.request,
        final_price: currency === "USD" ? finalPrice : finalPrice / exchangeRate
      } as PurchaseRequest
    }))
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
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
  setProfit: (profit) => set({ profit }),
})) 