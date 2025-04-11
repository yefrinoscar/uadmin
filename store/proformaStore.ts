import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ProformaItem, ClientInfo, Proforma } from '@/types'

interface ProformaState {
  currentStep: number
  proforma: Proforma
  formValid: {
    client: boolean
    items: boolean
    conditions: boolean
    summary: boolean
  }
  
  // Actions
  setCurrentStep: (step: number) => void
  setClientInfo: (info: Partial<ProformaState['proforma']['client']>) => void
  setItems: (items: ProformaItem[]) => void
  addItem: (item: ProformaItem) => void
  updateItem: (index: number, item: Partial<ProformaItem>) => void
  removeItem: (index: number) => void
  setConditions: (conditions: Partial<ProformaState['proforma']['conditions']>) => void
  validateStep: (step: keyof ProformaState['formValid'], isValid: boolean) => void
  reset: () => void

  // Computed
  getTotals: () => {
    subtotal: number;
    tax: number;
    total: number;
  }
}

const initialConditions = {
  include_igv: true,
  validity_period_days: 30,
  delivery_time: 'Inmediata',
  payment_method: 'CONTADO',
  warranty: '12 meses',
  warranty_months: 12,
  currency: 'S/',
  exchange_rate: 1,
  notes: '',
  expiration_date: null,
}

const initialState: Pick<ProformaState, 'proforma' | 'currentStep' > = {
  currentStep: 0,
  proforma: {
    id: '',
    status: 'draft',
    companyInfo: {
      ruc: '',
      name: '',
      address: ''
    },
    proformaInfo: {
      number: `001-${new Date().getFullYear()}`,
      date: new Date().toISOString().split('T')[0],
      currency: 'PEN',
      exchangeRate: 1
    },
    seller: {
      name: '',
      phone: '',
      email: ''
    },
    client: {
      id: '',
      name: '',
      address: '',
      ruc: '',
      contactPerson: ''
    },
    conditions: {
      includeIGV: true,
      validityPeriodDays: 30,
      deliveryTime: 'Inmediata',
      paymentMethod: 'CONTADO'
    },
    items: [],
    totalAmount: 0
  }
}

export const useProformaStore = create<ProformaState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),
      
      setClientInfo: (info) => {
        set((state) => ({
          proforma: { ...state.proforma, clientInfo: { ...state.proforma.client, ...info } },
        }))
        
        // Auto-validate client step
        const client_id = get().proforma.client.id
        if (client_id) {
          get().validateStep('client', true)
        }
      },
      
      setItems: (items) => {
        set({ proforma: { ...get().proforma, items } })
        // Auto-validate items step
        get().validateStep('items', items.length > 0)
      },
      
      addItem: (item) => {  
        set((state) => ({ 
          proforma: { ...state.proforma, items: [...state.proforma.items, item] }
        }))
        // Auto-validate items step
        get().validateStep('items', true)
      },
      
      updateItem: (index, item) => {
        set((state) => ({ 
          proforma: { ...state.proforma, items: state.proforma.items.map((i, idx) => 
            idx === index 
              ? { ...i, ...item } 
              : i
            )
          }
        }))
        // Auto-validate items step
        get().validateStep('items', true)
      },
      
      removeItem: (index) => {
        const { proforma: { items } } = get()
        set((state) => ({ 
          proforma: { ...state.proforma, items: state.proforma.items.filter((_, idx) => idx !== index) }
        }))
        // Auto-validate items step
                                                                                                                                                                                                                                                get().validateStep('items', items.length > 1)
      },
      
      setConditions: (conditions) => {
        set((state) => ({
          proforma: { ...state.proforma, conditions: { ...state.proforma.conditions, ...conditions } }
        }))
        
        // Auto-validate conditions step (always valid with defaults)
        const { validityPeriodDays } = get().proforma.conditions
          const isValid = (
          validityPeriodDays > 0
        )
        get().validateStep('conditions', isValid)
      },
      
      validateStep: (step, isValid) => {
        set((state) => ({
          formValid: {
            ...state.formValid,
            [step]: isValid
          }
        }))
      },
      
      reset: () => set(initialState),
      
      getTotals: () => {
        const { proforma: { items, conditions } } = get()
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
        const tax = conditions.includeIGV ? subtotal * 0.18 : 0
        return {
          subtotal,
          tax,
          total: subtotal + tax
        }
      }
    }),
    { name: 'proforma-store' }
  )
) 