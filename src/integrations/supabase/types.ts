export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          punch_in_lat: number | null
          punch_in_lng: number | null
          punch_in_photo_url: string | null
          punch_in_time: string | null
          punch_out_lat: number | null
          punch_out_lng: number | null
          punch_out_photo_url: string | null
          punch_out_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          punch_in_lat?: number | null
          punch_in_lng?: number | null
          punch_in_photo_url?: string | null
          punch_in_time?: string | null
          punch_out_lat?: number | null
          punch_out_lng?: number | null
          punch_out_photo_url?: string | null
          punch_out_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          punch_in_lat?: number | null
          punch_in_lng?: number | null
          punch_in_photo_url?: string | null
          punch_in_time?: string | null
          punch_out_lat?: number | null
          punch_out_lng?: number | null
          punch_out_photo_url?: string | null
          punch_out_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string
          expense_head: string
          id: string
          mode_of_payment: Database["public"]["Enums"]["payment_mode"]
          paid_to: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description: string
          expense_head: string
          id?: string
          mode_of_payment: Database["public"]["Enums"]["payment_mode"]
          paid_to?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string
          expense_head?: string
          id?: string
          mode_of_payment?: Database["public"]["Enums"]["payment_mode"]
          paid_to?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          closing_stock: number
          created_at: string | null
          date: string
          id: string
          opening_stock: number
          product_name: string
          production_added: number
          remarks: string | null
          sales_dispatched: number
          user_id: string
        }
        Insert: {
          closing_stock: number
          created_at?: string | null
          date: string
          id?: string
          opening_stock: number
          product_name: string
          production_added: number
          remarks?: string | null
          sales_dispatched: number
          user_id: string
        }
        Update: {
          closing_stock?: number
          created_at?: string | null
          date?: string
          id?: string
          opening_stock?: number
          product_name?: string
          production_added?: number
          remarks?: string | null
          sales_dispatched?: number
          user_id?: string
        }
        Relationships: []
      }
      outstanding: {
        Row: {
          amount_settled: number
          closing_outstanding: number
          created_at: string | null
          date: string
          id: string
          new_credit_amount: number
          opening_outstanding: number
          party_name: string
          party_type: Database["public"]["Enums"]["party_type"]
          user_id: string
        }
        Insert: {
          amount_settled: number
          closing_outstanding: number
          created_at?: string | null
          date: string
          id?: string
          new_credit_amount: number
          opening_outstanding: number
          party_name: string
          party_type: Database["public"]["Enums"]["party_type"]
          user_id: string
        }
        Update: {
          amount_settled?: number
          closing_outstanding?: number
          created_at?: string | null
          date?: string
          id?: string
          new_credit_amount?: number
          opening_outstanding?: number
          party_name?: string
          party_type?: Database["public"]["Enums"]["party_type"]
          user_id?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          created_at: string | null
          date: string
          description: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          location_text: string
          photo_url: string | null
          problem_type: Database["public"]["Enums"]["problem_type"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["problem_status"] | null
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location_text: string
          photo_url?: string | null
          problem_type: Database["public"]["Enums"]["problem_type"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location_text?: string
          photo_url?: string | null
          problem_type?: Database["public"]["Enums"]["problem_type"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      production: {
        Row: {
          created_at: string | null
          date: string
          id: string
          labour_name: string
          product_name: string
          quantity: number
          remarks: string | null
          shift: string | null
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          labour_name: string
          product_name: string
          quantity: number
          remarks?: string | null
          shift?: string | null
          unit: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          labour_name?: string
          product_name?: string
          quantity?: number
          remarks?: string | null
          shift?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string | null
          date: string
          id: string
          item_name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          rate: number
          total_amount: number
          unit: string
          user_id: string
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          item_name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          rate: number
          total_amount: number
          unit: string
          user_id: string
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          item_name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          rate?: number
          total_amount?: number
          unit?: string
          user_id?: string
          vendor_name?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string | null
          customer_name: string
          date: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_name: string
          quantity: number
          rate: number
          total_amount: number
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          date: string
          id?: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          product_name: string
          quantity: number
          rate: number
          total_amount: number
          unit: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          date?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          product_name?: string
          quantity?: number
          rate?: number
          total_amount?: number
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "plantManager"
      party_type: "VENDOR" | "CUSTOMER"
      payment_mode: "CASH" | "ONLINE"
      payment_status: "PAID" | "CREDIT"
      problem_status: "OPEN" | "RESOLVED"
      problem_type:
        | "MACHINE"
        | "RAW_MATERIAL"
        | "LABOUR"
        | "POWER"
        | "QUALITY"
        | "OTHER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "plantManager"],
      party_type: ["VENDOR", "CUSTOMER"],
      payment_mode: ["CASH", "ONLINE"],
      payment_status: ["PAID", "CREDIT"],
      problem_status: ["OPEN", "RESOLVED"],
      problem_type: [
        "MACHINE",
        "RAW_MATERIAL",
        "LABOUR",
        "POWER",
        "QUALITY",
        "OTHER",
      ],
    },
  },
} as const
