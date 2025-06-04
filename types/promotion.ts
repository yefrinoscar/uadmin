export type ConditionType = "category" | "tags"

export interface Promotion {
  id: string
  name: string
  title: string
  description: string
  condition_type: ConditionType
  condition_value: string
  background_color: string
  active: boolean
  is_main: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  text_color?: string
}

// Helper function to check if promotion is currently active based on dates
export function isPromotionCurrentlyActive(promotion: Promotion): boolean {
  const now = new Date()
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  
  return now >= startDate && now <= endDate && promotion.active
}

// Helper function to get promotion status
export function getPromotionStatus(promotion: Promotion): 'active' | 'expired' | 'pending' | 'inactive' {
  const now = new Date()
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  
  if (!promotion.active) return 'inactive'
  if (now < startDate) return 'pending'
  if (now > endDate) return 'expired'
  return 'active'
}

// Optional: Add form data type if needed
export interface PromotionFormData {
  name: string
  title: string
  condition_type: ConditionType
  condition_value: string
  active: boolean
  isMain: boolean
  start_date: string
  end_date: string
} 