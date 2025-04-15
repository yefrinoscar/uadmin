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