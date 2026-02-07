import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          category: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          category: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          category?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          category: string;
          brand: string;
          current_stock: number;
          unit_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          category: string;
          brand: string;
          current_stock?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          category?: string;
          brand?: string;
          current_stock?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_data: {
        Row: {
          id: string;
          product_id: string;
          shop_id: string;
          date: string;
          quantity_sold: number;
          revenue: number;
          is_festival: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          shop_id: string;
          date: string;
          quantity_sold: number;
          revenue?: number;
          is_festival?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          shop_id?: string;
          date?: string;
          quantity_sold?: number;
          revenue?: number;
          is_festival?: boolean;
          created_at?: string;
        };
      };
      forecasts: {
        Row: {
          id: string;
          product_id: string;
          shop_id: string;
          forecast_date: string;
          predicted_demand: number;
          recommended_stock: number;
          safety_stock: number;
          risk_level: string;
          model_used: string;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          shop_id: string;
          forecast_date: string;
          predicted_demand: number;
          recommended_stock: number;
          safety_stock: number;
          risk_level: string;
          model_used: string;
          confidence_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          shop_id?: string;
          forecast_date?: string;
          predicted_demand?: number;
          recommended_stock?: number;
          safety_stock?: number;
          risk_level?: string;
          model_used?: string;
          confidence_score?: number;
          created_at?: string;
        };
      };
    };
  };
}
