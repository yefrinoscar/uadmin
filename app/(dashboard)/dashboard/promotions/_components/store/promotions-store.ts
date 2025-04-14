import { create } from 'zustand';
import type { Promotion } from "@/types/promotion";

interface PromotionsState {
  // Core data
  promotions: Promotion[];
  originalPromotions: Promotion[];
  
  // UI state
  draggedPromotion: Promotion | null;
  currentPromotion: Promotion | null;
  isDialogOpen: boolean;
  isPending: boolean;
  searchTerm: string;
  replacingId: string | null;
  
  // Derived data getters
  getActivePromotions: () => Promotion[];
  getInactivePromotions: () => Promotion[];
  getFilteredInactivePromotions: () => Promotion[];
  hasChanges: () => boolean;
  
  // Actions
  setPromotions: (promotions: Promotion[]) => void;
  initializeStore: (promotions: Promotion[]) => void;
  resetChanges: () => void;
  
  // UI actions
  setCurrentPromotion: (promotion: Promotion | null) => void;
  setDialogOpen: (isOpen: boolean) => void;
  setPending: (isPending: boolean) => void;
  setSearchTerm: (term: string) => void;
  setDraggedPromotion: (promotion: Promotion | null) => void;
  setReplacingId: (id: string | null) => void;
  
  // Data modification actions
  toggleActive: (id: string, active: boolean) => void;
  setAsMain: (id: string) => void;
  updatePromotion: (updatedPromotion: Promotion) => void;
  removePromotion: (id: string) => void;
  addPromotion: (promotion: Promotion) => void;
  duplicatePromotion: (promotion: Promotion) => void;
}

export const usePromotionsStore = create<PromotionsState>((set, get) => ({
  // Core state
  promotions: [],
  originalPromotions: [],
  
  // UI state
  draggedPromotion: null,
  currentPromotion: null,
  isDialogOpen: false,
  isPending: false,
  searchTerm: "",
  replacingId: null,
  
  // Derived data (computed properties)
  getActivePromotions: () => {
    const now = new Date();
    return get().promotions.filter(p => {
      const startDate = new Date(p.start_date);
      const endDate = new Date(p.end_date);
      return p.active && startDate <= now && endDate > now;
    });
  },
  
  getInactivePromotions: () => {
    const now = new Date();
    return get().promotions.filter(p => {
      const startDate = new Date(p.start_date);
      const endDate = new Date(p.end_date);
      return !p.active || startDate > now || endDate <= now;
    });
  },
  
  getFilteredInactivePromotions: () => {
    const searchTerm = get().searchTerm.toLowerCase().trim();
    if (!searchTerm) return get().getInactivePromotions();
    
    return get().getInactivePromotions().filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      p.title.toLowerCase().includes(searchTerm)
    );
  },
  
  hasChanges: () => {
    const { promotions, originalPromotions } = get();
    
    // If lengths are different, there are changes
    if (promotions.length !== originalPromotions.length) return true;
    
    // Compare active/main status of every promotion
    return promotions.some(current => {
      const original = originalPromotions.find(p => p.id === current.id);
      return !original || 
        current.active !== original.active || 
        current.is_main !== original.is_main;
    });
  },
  
  // Core state actions
  setPromotions: (promotions) => set({ promotions }),
  
  initializeStore: (promotions) => {
    set({ 
      promotions,
      originalPromotions: structuredClone(promotions), // More efficient deep copy
    });
  },
  
  resetChanges: () => set(state => ({ 
    promotions: structuredClone(state.originalPromotions), // More efficient deep copy
    currentPromotion: null,
  })),
  
  // UI state actions
  setCurrentPromotion: (promotion) => set({ currentPromotion: promotion }),
  setDialogOpen: (isOpen) => set({ isDialogOpen: isOpen }),
  setPending: (isPending) => set({ isPending }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setDraggedPromotion: (promotion) => set({ draggedPromotion: promotion }),
  setReplacingId: (id) => set({ replacingId: id }),
  
  // Data modification actions
  toggleActive: (id, active) => set(state => ({
    promotions: state.promotions.map(p => 
      p.id === id ? { ...p, active } : p
    )
  })),
  
  setAsMain: (id) => set(state => ({
    promotions: state.promotions.map(p => ({
      ...p,
      is_main: p.id === id
    }))
  })),
  
  updatePromotion: (updatedPromotion) => set(state => ({ 
    promotions: state.promotions.map(p => 
      p.id === updatedPromotion.id ? updatedPromotion : p
    ),
    currentPromotion: null,
  })),
  
  removePromotion: (id) => set(state => ({ 
    promotions: state.promotions.filter(p => p.id !== id) 
  })),
  
  addPromotion: (promotion) => set(state => ({ 
    promotions: [...state.promotions, promotion],
    currentPromotion: null,
  })),
  
  duplicatePromotion: (promotion) => {
    const now = new Date();
    const duplicatedPromotion: Promotion = {
      ...promotion,
      id: `mock-${Date.now()}`,
      name: `${promotion.name} (Copia)`,
      active: false,
      is_main: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    
    set(state => ({ 
      promotions: [duplicatedPromotion, ...state.promotions]
    }));
  }
})); 