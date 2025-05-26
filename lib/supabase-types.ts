export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          birth_date: string
          email: string
          curp: string
          address: string
          phone: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          birth_date: string
          email: string
          curp: string
          address: string
          phone: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          birth_date?: string
          email?: string
          curp?: string
          address?: string
          phone?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      bicycles: {
        Row: {
          id: string
          user_id: string
          serial_number: string
          brand: string
          model: string
          color: string
          characteristics: string | null
          registration_date: string
          payment_status: boolean
          theft_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          serial_number: string
          brand: string
          model: string
          color: string
          characteristics?: string | null
          registration_date?: string
          payment_status?: boolean
          theft_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          serial_number?: string
          brand?: string
          model?: string
          color?: string
          characteristics?: string | null
          registration_date?: string
          payment_status?: boolean
          theft_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      bicycle_images: {
        Row: {
          id: string
          bicycle_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          bicycle_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          bicycle_id?: string
          image_url?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          bicycle_id: string
          stripe_payment_id: string | null
          amount: number
          payment_status: string
          payment_type: string
          subscription_id: string | null
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bicycle_id: string
          stripe_payment_id?: string | null
          amount: number
          payment_status?: string
          payment_type?: string
          subscription_id?: string | null
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bicycle_id?: string
          stripe_payment_id?: string | null
          amount?: number
          payment_status?: string
          payment_type?: string
          subscription_id?: string | null
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      theft_reports: {
        Row: {
          id: string
          bicycle_id: string
          user_id: string
          report_date: string
          location: string | null
          description: string | null
          police_report_number: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bicycle_id: string
          user_id: string
          report_date?: string
          location?: string | null
          description?: string | null
          police_report_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bicycle_id?: string
          user_id?: string
          report_date?: string
          location?: string | null
          description?: string | null
          police_report_number?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
