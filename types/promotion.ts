export type ConditionType = "category" | "tags"

export interface Promotion {
  id: string
  name: string
  title: string
  condition_type: ConditionType
  condition_content: string
  backgroundColor: string
  active: boolean
  isMain: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

// Optional: Add form data type if needed
export interface PromotionFormData {
  name: string
  title: string
  condition_type: ConditionType
  condition_content: string
  active: boolean
  isMain: boolean
  start_date: string
  end_date: string
} 