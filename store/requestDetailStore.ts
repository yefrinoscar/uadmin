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
}

interface RequestDetailState {
  // Data
  request: Request | null
  selectedProducts: Product[]
  basePrice: number
  shipping: number
  tax: number
  total: number
  notes: string
  response: string
  calculations: any
  weight: number
  
  // UI state
  loading: boolean
  isLoading: boolean
  isSendingEmail: boolean
  emailSent: boolean
  
  // Actions
  setRequest: (request: any) => void
  setSelectedProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  removeProduct: (productId: string) => void
  setBasePrice: (price: number) => void
  setShipping: (shipping: number) => void
  setTax: (tax: number) => void
  setTotal: (total: number) => void
  setNotes: (notes: string) => void
  setLoading: (loading: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setResponse: (response: string) => void
  setCalculations: (calculations: any) => void
  setIsSendingEmail: (isSendingEmail: boolean) => void
  setEmailSent: (emailSent: boolean) => void
  setWeight: (weight: number) => void
}

export const useRequestDetailStore = create<RequestDetailState>((set) => ({
  // Initial state
  request: null,
  selectedProducts: [],
  basePrice: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  notes: "",
  loading: false,
  isLoading: true,
  response: "",
  calculations: null,
  isSendingEmail: false,
  emailSent: false,
  weight: 0,

  // Actions
  setRequest: (request) => set({ request }),
  
  setSelectedProducts: (products) => {
    set({ selectedProducts: products })
    // Recalculate totals when products change
    const basePrice = products.reduce((sum, product) => sum + product.price, 0)
    const weight = products.reduce((sum, product) => sum + (product.weight || 0), 0)
    set({ basePrice, weight })
    // Calculate total
    set((state) => ({ 
      total: state.basePrice + state.shipping + state.tax
    }))
  },
  
  addProduct: (product) => {
    set((state) => {
      const products = [...state.selectedProducts, product]
      const basePrice = products.reduce((sum, p) => sum + p.price, 0)
      const weight = products.reduce((sum, p) => sum + (p.weight || 0), 0)
      return { 
        selectedProducts: products,
        basePrice: basePrice,
        weight: weight,
        total: basePrice + state.shipping + state.tax
      }
    })
    toast.success("Producto añadido")
  },
  
  removeProduct: (productId) => {
    set((state) => {
      const products = state.selectedProducts.filter(product => product.id !== productId)
      const basePrice = products.reduce((sum, p) => sum + p.price, 0)
      const weight = products.reduce((sum, p) => sum + (p.weight || 0), 0)
      return { 
        selectedProducts: products,
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
  setResponse: (response) => set({ response }),
  setCalculations: (calculations) => set({ calculations }),
  setIsSendingEmail: (isSendingEmail) => set({ isSendingEmail }),
  setEmailSent: (emailSent) => set({ emailSent }),
  setWeight: (weight) => set({ weight })
})) 