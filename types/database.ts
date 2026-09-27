/**
 * Generated-style Supabase database types.
 *
 * These mirror `sql/schema.sql` by hand. If the schema changes, update here
 * (or regenerate with `supabase gen types typescript` and paste the result).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          name: string;
          brand: string | null;
          model: string | null;
          year: number | null;
          police_number: string | null;
          current_km: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          police_number?: string | null;
          current_km?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          police_number?: string | null;
          current_km?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      repair_records: {
        Row: {
          id: string;
          vehicle_id: string;
          repair_date: string;
          odometer: number;
          repair_type: string;
          complaint: string | null;
          labor_cost: number;
          additional_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          repair_date: string;
          odometer: number;
          repair_type: string;
          complaint?: string | null;
          labor_cost?: number;
          additional_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          repair_date?: string;
          odometer?: number;
          repair_type?: string;
          complaint?: string | null;
          labor_cost?: number;
          additional_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repair_records_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      repair_parts: {
        Row: {
          id: string;
          repair_id: string;
          name: string;
          brand: string | null;
          quantity: number;
          unit_price: number;
          subtotal: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          repair_id: string;
          name: string;
          brand?: string | null;
          quantity: number;
          unit_price?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          repair_id?: string;
          name?: string;
          brand?: string | null;
          quantity?: number;
          unit_price?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "repair_parts_repair_id_fkey";
            columns: ["repair_id"];
            isOneToOne: false;
            referencedRelation: "repair_records";
            referencedColumns: ["id"];
          }
        ];
      };
      repair_work: {
        Row: {
          id: string;
          repair_id: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          repair_id: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          repair_id?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repair_work_repair_id_fkey";
            columns: ["repair_id"];
            isOneToOne: false;
            referencedRelation: "repair_records";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          police_number: string;
          phone: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          police_number: string;
          phone?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          police_number?: string;
          phone?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      repairs_view: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string | null;
          repair_date: string;
          odometer: number;
          repair_type: string;
          complaint: string | null;
          labor_cost: number;
          additional_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          parts_cost: number;
          parts_count: number;
          work_count: number;
          total_cost: number;
        };
        Relationships: [];
      };
      repairs_search_view: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string | null;
          repair_date: string;
          odometer: number;
          repair_type: string;
          complaint: string | null;
          labor_cost: number;
          additional_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          parts_cost: number;
          parts_count: number;
          work_count: number;
          total_cost: number;
          vehicle_name: string;
          police_number: string | null;
          part_names: string | null;
        };
        Relationships: [];
      };
      vehicle_stats_view: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          brand: string | null;
          model: string | null;
          year: number | null;
          police_number: string | null;
          current_km: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          repair_count: number;
          total_spend: number;
          last_repair_date: string | null;
          last_odometer: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      save_repair: {
        Args: { payload: Json };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
