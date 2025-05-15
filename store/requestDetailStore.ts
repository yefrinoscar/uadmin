"use client"

import { create } from "zustand"
import { toast } from "sonner"
import { Product } from "@/trpc/api/routers/requests"

export interface Request {
  id: string
  status: string
  createdAt: string
  userId: string
  title: string
  description?: string
  basePrice: number
  shipping?: number
  tax?: number
  total?: number
  notes?: string
  client?: {
    email: string | null
    phone_number: string | null
    name?: string | null
  } | null
  response?: string
  email_sent?: boolean
  price?: number
  total_price?: number
  final_price?: number
}

interface RequestDetailState {
  // Data
  request: Request | null
  products: Product[]
  basePrice: number
  shipping: number
  tax: number
  total: number
  notes: string
  calculations: any
  weight: number
  exchangeRate: number
  totalGeneralUSD: number
  finalPriceUSD: number
  finalPriceDisplayCurrency: "PEN" | "USD"
  profit: number
  
  // UI state
  loading: boolean
  isLoading: boolean
  
  // Actions
  setRequest: (request: any) => void
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  removeProduct: (productId: string) => void
  setBasePrice: (price: number) => void
  setShipping: (shipping: number) => void
  setTax: (tax: number) => void
  setTotal: (total: number) => void
  setNotes: (notes: string) => void
  setLoading: (loading: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setCalculations: (calculations: any) => void
  setWeight: (weight: number) => void
  setExchangeRate: (rate: number) => void
  setTotalGeneralUSD: (amount: number) => void
  setFinalPriceUSD: (price: number) => void
  setFinalPriceDisplayCurrency: (currency: "PEN" | "USD") => void
  setProfit: (profit: number) => void
  
  // Computed getters for PEN values (derived from USD)
  getTotalGeneralPEN: () => number
  getFinalPricePEN: () => number
}

export const useRequestDetailStore = create<RequestDetailState>((set, get) => ({
  // Initial state
  request: null,
  products: [],
  basePrice: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  notes: "",
  loading: false,
  isLoading: true,
  calculations: null,
  weight: 0,
  exchangeRate: 3.7,
  totalGeneralUSD: 0,
  finalPriceUSD: 0,
  finalPriceDisplayCurrency: "PEN" as "PEN" | "USD",
  profit: 0,

  // Actions
  setRequest: (request) => set({ request }),
  
  setProducts: (products) => {
    set({ products })
    // Recalculate totals when products change
    const basePrice = products.reduce((sum, product) => sum + (product.base_price || 0), 0)
    const weight = products.reduce((sum, product) => sum + (product.weight || 0), 0)
    set({ basePrice, weight })
    // Calculate total
    set((state) => ({ 
      total: state.basePrice + state.shipping + state.tax
    }))
  },
  
  addProduct: (product) => {
    set((state) => {
      const products = [...state.products, product]
      const basePrice = products.reduce((sum, p) => sum + (p.base_price || 0), 0)
      const weight = products.reduce((sum, p) => sum + (p.weight || 0), 0)
      return { 
        products: products,
        basePrice: basePrice,
        weight: weight,
        total: basePrice + state.shipping + state.tax
      }
    })
    toast.success("Producto añadido")
  },
  
  removeProduct: (productId) => {
    set((state) => {
      const products = state.products.filter(product => product.id !== productId)
      const basePrice = products.reduce((sum, p) => sum + (p.base_price || 0), 0)
      const weight = products.reduce((sum, p) => sum + (p.weight || 0), 0)
      return { 
        products,
        basePrice: basePrice,
        weight: weight,
        total: basePrice + state.shipping + state.tax
      }
    })
    toast.success("Producto eliminado")
  },
  
  setBasePrice: (basePrice) => {
    set((state) => ({ 
      basePrice,
      total: basePrice + state.shipping + state.tax
    }))
  },
  
  setShipping: (shipping) => {
    set((state) => ({ 
      shipping,
      total: state.basePrice + shipping + state.tax
    }))
  },
  
  setTax: (tax) => {
    set((state) => ({ 
      tax,
      total: state.basePrice + state.shipping + tax
    }))
  },
  
  setTotal: (total) => set({ total }),
  
  setNotes: (notes) => set({ notes }),
  
  // UI state
  setLoading: (loading) => set({ loading }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setCalculations: (calculations) => set({ calculations }),
  setWeight: (weight) => set({ weight }),
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
  setTotalGeneralUSD: (amount) => set({ totalGeneralUSD: amount }),
  setFinalPriceUSD: (price) => set({ finalPriceUSD: price }),
  setFinalPriceDisplayCurrency: (currency) => set({ finalPriceDisplayCurrency: currency }),
  setProfit: (profit) => set({ profit }),
  
  // Computed getters
  getTotalGeneralPEN: () => {
    const state = get();
    return state.totalGeneralUSD * state.exchangeRate;
  },
  getFinalPricePEN: () => {
    const state = get();
    return state.finalPriceUSD * state.exchangeRate;
  }
})) 