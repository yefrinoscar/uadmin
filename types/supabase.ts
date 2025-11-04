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
      proformas: {
        Row: {
          id: string
          created_at: string
          number: string
          date: string
          due_date: string
          currency: string
          exchange_rate: number
          subtotal: number
          tax: number
          total: number
          status: string
          notes: string | null
          created_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          number: string
          date: string
          due_date: string
          currency: string
          exchange_rate: number
          subtotal: number
          tax: number
          total: number
          status: string
          notes?: string | null
          created_by: string
        }
        Update: {
          id?: string
          created_at?: string
          number?: string
          date?: string
          due_date?: string
          currency?: string
          exchange_rate?: number
          subtotal?: number
          tax?: number
          total?: number
          status?: string
          notes?: string | null
          created_by?: string
        }
      }
      // Add other table definitions as needed
    }
  }
} 