export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      promotions: {
        Row: {
          id: string
          name: string
          title: string
          condition_type: "category" | "tags"
          condition_value: string
          active: boolean
          is_main: boolean
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
          text_color: string | null
          background_color: string | null
        }
        Insert: Omit<Database['public']['Tables']['promotions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['promotions']['Row']>
      }
    }
  }
} 