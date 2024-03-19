export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          category: Database["public"]["Enums"]["account_category"]
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["account_category"]
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["account_category"]
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      currencies: {
        Row: {
          country: string
          id: string
          name: string
        }
        Insert: {
          country: string
          id: string
          name: string
        }
        Update: {
          country?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          from: string
          rate: number
          to: string
        }
        Insert: {
          from: string
          rate: number
          to: string
        }
        Update: {
          from?: string
          rate?: number
          to?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_exchange_rates_from_fkey"
            columns: ["from"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_exchange_rates_to_fkey"
            columns: ["to"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          }
        ]
      }
      subaccounts: {
        Row: {
          account_id: string
          created_at: string
          currency: string
          id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          currency: string
          id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          currency?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_subaccounts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subaccounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance: number
          completed_date: string
          description: string
          external_ref: string | null
          id: string
          started_date: string
          subaccount_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          balance: number
          completed_date: string
          description?: string
          external_ref?: string | null
          id?: string
          started_date: string
          subaccount_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          balance?: number
          completed_date?: string
          description?: string
          external_ref?: string | null
          id?: string
          started_date?: string
          subaccount_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "public_transactions_subaccount_id_fkey"
            columns: ["subaccount_id"]
            isOneToOne: false
            referencedRelation: "subaccounts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      balances: {
        Row: {
          balance: number | null
          subaccount_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_transactions_subaccount_id_fkey"
            columns: ["subaccount_id"]
            isOneToOne: false
            referencedRelation: "subaccounts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      query_transaction_history: {
        Args: {
          date_range: string
          bucket_interval: string
        }
        Returns: {
          subaccount_id: string
          interval_start: string
          last_balance: number
        }[]
      }
    }
    Enums: {
      account_category: "checking" | "investment"
      transaction_type:
        | "card_payment"
        | "transfer"
        | "exchange"
        | "topup"
        | "correction"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
