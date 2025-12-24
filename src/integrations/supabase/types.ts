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
      advances: {
        Row: {
          advance_date: string
          amount: number
          created_at: string
          created_by: string
          id: string
          reason: string | null
          remaining_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_date: string
          amount: number
          created_at?: string
          created_by: string
          id?: string
          reason?: string | null
          remaining_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_date?: string
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          reason?: string | null
          remaining_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          status: string | null
          user_id: string
          user_name: string | null
          working_hours: number | null
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
          status?: string | null
          user_id: string
          user_name?: string | null
          working_hours?: number | null
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
          status?: string | null
          user_id?: string
          user_name?: string | null
          working_hours?: number | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          amount_received: number
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          invoice_id: string
          mode_of_payment: Database["public"]["Enums"]["collection_payment_mode"]
          payment_date: string
          reference_no: string | null
          remarks: string | null
        }
        Insert: {
          amount_received: number
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          invoice_id: string
          mode_of_payment: Database["public"]["Enums"]["collection_payment_mode"]
          payment_date: string
          reference_no?: string | null
          remarks?: string | null
        }
        Update: {
          amount_received?: number
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string
          mode_of_payment?: Database["public"]["Enums"]["collection_payment_mode"]
          payment_date?: string
          reference_no?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      employee_salaries: {
        Row: {
          created_at: string | null
          id: string
          monthly_salary: number | null
          overtime_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_salary?: number | null
          overtime_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_salary?: number | null
          overtime_rate?: number | null
          updated_at?: string | null
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
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          line_total: number
          product_name: string
          quantity: number
          rate: number
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          line_total: number
          product_name: string
          quantity: number
          rate: number
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          line_total?: number
          product_name?: string
          quantity?: number
          rate?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          billing_address: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          grand_total: number
          gst_amount: number
          gst_percent: number
          id: string
          invoice_date: string
          invoice_no: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["invoice_payment_status"]
          ship_to_address: string | null
          sub_total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          billing_address?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          grand_total?: number
          gst_amount?: number
          gst_percent?: number
          id?: string
          invoice_date: string
          invoice_no: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["invoice_payment_status"]
          ship_to_address?: string | null
          sub_total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          billing_address?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          grand_total?: number
          gst_amount?: number
          gst_percent?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["invoice_payment_status"]
          ship_to_address?: string | null
          sub_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"] | null
          overtime_hours: number | null
          reason: string
          request_date: string
          request_type: Database["public"]["Enums"]["request_type"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"] | null
          overtime_hours?: number | null
          reason: string
          request_date: string
          request_type: Database["public"]["Enums"]["request_type"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"] | null
          overtime_hours?: number | null
          reason?: string
          request_date?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
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
      salary_settings: {
        Row: {
          cap_at_monthly_salary: boolean
          created_at: string
          default_monthly_salary: number
          id: string
          min_days_for_weekly_off_paid: number
          updated_at: string
          weekly_off_day: string
        }
        Insert: {
          cap_at_monthly_salary?: boolean
          created_at?: string
          default_monthly_salary?: number
          id?: string
          min_days_for_weekly_off_paid?: number
          updated_at?: string
          weekly_off_day?: string
        }
        Update: {
          cap_at_monthly_salary?: boolean
          created_at?: string
          default_monthly_salary?: number
          id?: string
          min_days_for_weekly_off_paid?: number
          updated_at?: string
          weekly_off_day?: string
        }
        Relationships: []
      }
      salary_slips: {
        Row: {
          advance_balance_after: number | null
          advance_deduction: number | null
          basic_salary: number
          days_absent: number
          days_half: number
          days_present: number
          deductions: number
          generated_at: string
          generated_by: string
          gross_salary: number | null
          id: string
          month: number
          monthly_salary: number | null
          net_salary: number
          notes: string | null
          other_deductions: number | null
          overtime_hours: number
          overtime_pay: number
          paid_days: number | null
          per_day_salary: number | null
          regular_hours: number
          total_days_in_month: number | null
          total_hours_worked: number
          total_working_days: number
          user_id: string
          weekly_off_days: number | null
          year: number
        }
        Insert: {
          advance_balance_after?: number | null
          advance_deduction?: number | null
          basic_salary?: number
          days_absent?: number
          days_half?: number
          days_present?: number
          deductions?: number
          generated_at?: string
          generated_by: string
          gross_salary?: number | null
          id?: string
          month: number
          monthly_salary?: number | null
          net_salary?: number
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number
          overtime_pay?: number
          paid_days?: number | null
          per_day_salary?: number | null
          regular_hours?: number
          total_days_in_month?: number | null
          total_hours_worked?: number
          total_working_days?: number
          user_id: string
          weekly_off_days?: number | null
          year: number
        }
        Update: {
          advance_balance_after?: number | null
          advance_deduction?: number | null
          basic_salary?: number
          days_absent?: number
          days_half?: number
          days_present?: number
          deductions?: number
          generated_at?: string
          generated_by?: string
          gross_salary?: number | null
          id?: string
          month?: number
          monthly_salary?: number | null
          net_salary?: number
          notes?: string | null
          other_deductions?: number | null
          overtime_hours?: number
          overtime_pay?: number
          paid_days?: number | null
          per_day_salary?: number | null
          regular_hours?: number
          total_days_in_month?: number | null
          total_hours_worked?: number
          total_working_days?: number
          user_id?: string
          weekly_off_days?: number | null
          year?: number
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
      expire_attendance_sessions: { Args: never; Returns: undefined }
      generate_invoice_number: { Args: { user_id: string }; Returns: string }
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
      app_role: "admin" | "plantManager" | "productionManager" | "accountant"
      collection_payment_mode: "CASH" | "UPI" | "ONLINE" | "BANK"
      invoice_payment_status: "UNPAID" | "PARTIAL" | "PAID"
      leave_type: "FULL_DAY" | "HALF_DAY"
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
      request_status: "PENDING" | "APPROVED" | "REJECTED"
      request_type: "LEAVE" | "OVERTIME"
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
      app_role: ["admin", "plantManager", "productionManager", "accountant"],
      collection_payment_mode: ["CASH", "UPI", "ONLINE", "BANK"],
      invoice_payment_status: ["UNPAID", "PARTIAL", "PAID"],
      leave_type: ["FULL_DAY", "HALF_DAY"],
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
      request_status: ["PENDING", "APPROVED", "REJECTED"],
      request_type: ["LEAVE", "OVERTIME"],
    },
  },
} as const
