export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          category: Database['public']['Enums']['account_category'];
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category: Database['public']['Enums']['account_category'];
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          category?: Database['public']['Enums']['account_category'];
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      currencies: {
        Row: {
          country: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          country: string;
          id: string;
          name: string;
        };
        Update: {
          country?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          from: string;
          rate: number;
          to: string;
        };
        ComputedFields: never;
        Insert: {
          from: string;
          rate: number;
          to: string;
        };
        Update: {
          from?: string;
          rate?: number;
          to?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exchange_rates_from_currencies_id_fk';
            columns: ['from'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exchange_rates_to_currencies_id_fk';
            columns: ['to'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['id'];
          },
        ];
      };
      integration_links: {
        Row: {
          created_at: string;
          id: string;
          integration_account_id: string;
          integration_id: string;
          last_synced_at: string | null;
          subaccount_id: string;
          sync_count: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          integration_account_id: string;
          integration_id: string;
          last_synced_at?: string | null;
          subaccount_id: string;
          sync_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          integration_account_id?: string;
          integration_id?: string;
          last_synced_at?: string | null;
          subaccount_id?: string;
          sync_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'integration_links_integration_id_integrations_id_fk';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integration_links_subaccount_id_subaccounts_id_fk';
            columns: ['subaccount_id'];
            isOneToOne: true;
            referencedRelation: 'subaccounts';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          created_at: string;
          external_id: string;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          external_id: string;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          external_id?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          main_currency: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          main_currency?: string;
        };
        Update: {
          id?: string;
          main_currency?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_main_currency_currencies_id_fk';
            columns: ['main_currency'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['id'];
          },
        ];
      };
      subaccounts: {
        Row: {
          account_id: string;
          created_at: string;
          currency: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          account_id: string;
          created_at?: string;
          currency: string;
          id?: string;
          name?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subaccounts_account_id_accounts_id_fk';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subaccounts_currency_currencies_id_fk';
            columns: ['currency'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          balance: number;
          completed_date: string;
          counterparty_name: string;
          created_at: string;
          data_source: string;
          description: string;
          external_ref: string | null;
          id: string;
          sequence: number;
          started_date: string;
          subaccount_id: string;
          type: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          balance: number;
          completed_date: string;
          counterparty_name?: string;
          created_at?: string;
          data_source?: string;
          description?: string;
          external_ref?: string | null;
          id?: string;
          sequence?: never;
          started_date: string;
          subaccount_id: string;
          type: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          balance?: number;
          completed_date?: string;
          counterparty_name?: string;
          created_at?: string;
          data_source?: string;
          description?: string;
          external_ref?: string | null;
          id?: string;
          sequence?: never;
          started_date?: string;
          subaccount_id?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_subaccount_id_subaccounts_id_fk';
            columns: ['subaccount_id'];
            isOneToOne: false;
            referencedRelation: 'subaccounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      balances: {
        Row: {
          balance: number | null;
          started_date: string | null;
          subaccount_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: 'transactions_subaccount_id_subaccounts_id_fk';
            columns: ['subaccount_id'];
            isOneToOne: false;
            referencedRelation: 'subaccounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      add_compression_policy: {
        Args: {
          compress_after: unknown;
          hypertable: unknown;
          if_not_exists?: boolean;
          initial_start?: string;
          schedule_interval?: string;
          timezone?: string;
        };
        Returns: number;
      };
      add_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown;
          end_offset: unknown;
          if_not_exists?: boolean;
          initial_start?: string;
          schedule_interval: string;
          start_offset: unknown;
          timezone?: string;
        };
        Returns: number;
      };
      add_data_node: {
        Args: {
          bootstrap?: boolean;
          database?: unknown;
          host: string;
          if_not_exists?: boolean;
          node_name: unknown;
          password?: string;
          port?: number;
        };
        Returns: {
          database: unknown;
          database_created: boolean;
          extension_created: boolean;
          host: string;
          node_created: boolean;
          node_name: unknown;
          port: number;
        }[];
      };
      add_dimension: {
        Args: {
          chunk_time_interval?: unknown;
          column_name: unknown;
          hypertable: unknown;
          if_not_exists?: boolean;
          number_partitions?: number;
          partitioning_func?: unknown;
        };
        Returns: {
          column_name: unknown;
          created: boolean;
          dimension_id: number;
          schema_name: unknown;
          table_name: unknown;
        }[];
      };
      add_job: {
        Args: {
          check_config?: unknown;
          config?: Json;
          fixed_schedule?: boolean;
          initial_start?: string;
          proc: unknown;
          schedule_interval: string;
          scheduled?: boolean;
          timezone?: string;
        };
        Returns: number;
      };
      add_reorder_policy: {
        Args: {
          hypertable: unknown;
          if_not_exists?: boolean;
          index_name: unknown;
          initial_start?: string;
          timezone?: string;
        };
        Returns: number;
      };
      add_retention_policy: {
        Args: {
          drop_after: unknown;
          if_not_exists?: boolean;
          initial_start?: string;
          relation: unknown;
          schedule_interval?: string;
          timezone?: string;
        };
        Returns: number;
      };
      alter_data_node: {
        Args: {
          available?: boolean;
          database?: unknown;
          host?: string;
          node_name: unknown;
          port?: number;
        };
        Returns: {
          available: boolean;
          database: unknown;
          host: string;
          node_name: unknown;
          port: number;
        }[];
      };
      alter_job: {
        Args: {
          check_config?: unknown;
          config?: Json;
          if_exists?: boolean;
          job_id: number;
          max_retries?: number;
          max_runtime?: string;
          next_start?: string;
          retry_period?: string;
          schedule_interval?: string;
          scheduled?: boolean;
        };
        Returns: {
          check_config: string;
          config: Json;
          job_id: number;
          max_retries: number;
          max_runtime: string;
          next_start: string;
          retry_period: string;
          schedule_interval: string;
          scheduled: boolean;
        }[];
      };
      approximate_row_count: { Args: { relation: unknown }; Returns: number };
      attach_data_node: {
        Args: {
          hypertable: unknown;
          if_not_attached?: boolean;
          node_name: unknown;
          repartition?: boolean;
        };
        Returns: {
          hypertable_id: number;
          node_hypertable_id: number;
          node_name: unknown;
        }[];
      };
      attach_tablespace: {
        Args: { hypertable: unknown; if_not_attached?: boolean; tablespace: unknown };
        Returns: undefined;
      };
      chunk_compression_stats: {
        Args: { hypertable: unknown };
        Returns: {
          after_compression_index_bytes: number;
          after_compression_table_bytes: number;
          after_compression_toast_bytes: number;
          after_compression_total_bytes: number;
          before_compression_index_bytes: number;
          before_compression_table_bytes: number;
          before_compression_toast_bytes: number;
          before_compression_total_bytes: number;
          chunk_name: unknown;
          chunk_schema: unknown;
          compression_status: string;
          node_name: unknown;
        }[];
      };
      chunks_detailed_size: {
        Args: { hypertable: unknown };
        Returns: {
          chunk_name: unknown;
          chunk_schema: unknown;
          index_bytes: number;
          node_name: unknown;
          table_bytes: number;
          toast_bytes: number;
          total_bytes: number;
        }[];
      };
      compress_chunk: {
        Args: { if_not_compressed?: boolean; uncompressed_chunk: unknown };
        Returns: unknown;
      };
      create_distributed_hypertable: {
        Args: {
          associated_schema_name?: unknown;
          associated_table_prefix?: unknown;
          chunk_sizing_func?: unknown;
          chunk_target_size?: string;
          chunk_time_interval?: unknown;
          create_default_indexes?: boolean;
          data_nodes?: unknown[];
          if_not_exists?: boolean;
          migrate_data?: boolean;
          number_partitions?: number;
          partitioning_column?: unknown;
          partitioning_func?: unknown;
          relation: unknown;
          replication_factor?: number;
          time_column_name: unknown;
          time_partitioning_func?: unknown;
        };
        Returns: {
          created: boolean;
          hypertable_id: number;
          schema_name: unknown;
          table_name: unknown;
        }[];
      };
      create_distributed_restore_point: {
        Args: { name: string };
        Returns: {
          node_name: unknown;
          node_type: string;
          restore_point: unknown;
        }[];
      };
      create_hypertable: {
        Args: {
          associated_schema_name?: unknown;
          associated_table_prefix?: unknown;
          chunk_sizing_func?: unknown;
          chunk_target_size?: string;
          chunk_time_interval?: unknown;
          create_default_indexes?: boolean;
          data_nodes?: unknown[];
          distributed?: boolean;
          if_not_exists?: boolean;
          migrate_data?: boolean;
          number_partitions?: number;
          partitioning_column?: unknown;
          partitioning_func?: unknown;
          relation: unknown;
          replication_factor?: number;
          time_column_name: unknown;
          time_partitioning_func?: unknown;
        };
        Returns: {
          created: boolean;
          hypertable_id: number;
          schema_name: unknown;
          table_name: unknown;
        }[];
      };
      decompress_chunk: {
        Args: { if_compressed?: boolean; uncompressed_chunk: unknown };
        Returns: unknown;
      };
      delete_data_node: {
        Args: {
          drop_database?: boolean;
          force?: boolean;
          if_exists?: boolean;
          node_name: unknown;
          repartition?: boolean;
        };
        Returns: boolean;
      };
      delete_job: { Args: { job_id: number }; Returns: undefined };
      detach_data_node: {
        Args: {
          drop_remote_data?: boolean;
          force?: boolean;
          hypertable?: unknown;
          if_attached?: boolean;
          node_name: unknown;
          repartition?: boolean;
        };
        Returns: number;
      };
      detach_tablespace: {
        Args: { hypertable?: unknown; if_attached?: boolean; tablespace: unknown };
        Returns: number;
      };
      detach_tablespaces: { Args: { hypertable: unknown }; Returns: number };
      drop_chunks: {
        Args: { newer_than?: unknown; older_than?: unknown; relation: unknown; verbose?: boolean };
        Returns: string[];
      };
      get_telemetry_report: { Args: Record<PropertyKey, never>; Returns: Json };
      hypertable_compression_stats: {
        Args: { hypertable: unknown };
        Returns: {
          after_compression_index_bytes: number;
          after_compression_table_bytes: number;
          after_compression_toast_bytes: number;
          after_compression_total_bytes: number;
          before_compression_index_bytes: number;
          before_compression_table_bytes: number;
          before_compression_toast_bytes: number;
          before_compression_total_bytes: number;
          node_name: unknown;
          number_compressed_chunks: number;
          total_chunks: number;
        }[];
      };
      hypertable_detailed_size: {
        Args: { hypertable: unknown };
        Returns: {
          index_bytes: number;
          node_name: unknown;
          table_bytes: number;
          toast_bytes: number;
          total_bytes: number;
        }[];
      };
      hypertable_index_size: { Args: { index_name: unknown }; Returns: number };
      hypertable_size: { Args: { hypertable: unknown }; Returns: number };
      interpolate:
        | {
            Args: { next?: Record<string, unknown>; prev?: Record<string, unknown>; value: number };
            Returns: number;
          }
        | {
            Args: { next?: Record<string, unknown>; prev?: Record<string, unknown>; value: number };
            Returns: number;
          }
        | {
            Args: { next?: Record<string, unknown>; prev?: Record<string, unknown>; value: number };
            Returns: number;
          }
        | {
            Args: { next?: Record<string, unknown>; prev?: Record<string, unknown>; value: number };
            Returns: number;
          }
        | {
            Args: { next?: Record<string, unknown>; prev?: Record<string, unknown>; value: number };
            Returns: number;
          };
      locf: {
        Args: { prev?: unknown; treat_null_as_missing?: boolean; value: unknown };
        Returns: unknown;
      };
      move_chunk: {
        Args: {
          chunk: unknown;
          destination_tablespace: unknown;
          index_destination_tablespace?: unknown;
          reorder_index?: unknown;
          verbose?: boolean;
        };
        Returns: undefined;
      };
      query_transaction_history: {
        Args: { bucket_interval: string; date_range: string };
        Returns: {
          interval_start: string;
          last_balance: number;
          subaccount_id: string;
        }[];
      };
      remove_compression_policy: {
        Args: { hypertable: unknown; if_exists?: boolean };
        Returns: boolean;
      };
      remove_continuous_aggregate_policy: {
        Args: { continuous_aggregate: unknown; if_exists?: boolean; if_not_exists?: boolean };
        Returns: undefined;
      };
      remove_reorder_policy: {
        Args: { hypertable: unknown; if_exists?: boolean };
        Returns: undefined;
      };
      remove_retention_policy: {
        Args: { if_exists?: boolean; relation: unknown };
        Returns: undefined;
      };
      reorder_chunk: {
        Args: { chunk: unknown; index?: unknown; verbose?: boolean };
        Returns: undefined;
      };
      set_adaptive_chunking: {
        Args: { chunk_sizing_func?: unknown; chunk_target_size: string; hypertable: unknown };
        Returns: Record<string, unknown>;
      };
      set_chunk_time_interval: {
        Args: { chunk_time_interval: unknown; dimension_name?: unknown; hypertable: unknown };
        Returns: undefined;
      };
      set_integer_now_func: {
        Args: { hypertable: unknown; integer_now_func: unknown; replace_if_exists?: boolean };
        Returns: undefined;
      };
      set_number_partitions: {
        Args: { dimension_name?: unknown; hypertable: unknown; number_partitions: number };
        Returns: undefined;
      };
      set_replication_factor: {
        Args: { hypertable: unknown; replication_factor: number };
        Returns: undefined;
      };
      show_chunks: {
        Args: { newer_than?: unknown; older_than?: unknown; relation: unknown };
        Returns: unknown[];
      };
      show_tablespaces: { Args: { hypertable: unknown }; Returns: unknown[] };
      time_bucket:
        | { Args: { bucket_width: number; ts: number }; Returns: number }
        | { Args: { bucket_width: number; offset: number; ts: number }; Returns: number }
        | { Args: { bucket_width: number; ts: number }; Returns: number }
        | { Args: { bucket_width: number; offset: number; ts: number }; Returns: number }
        | { Args: { bucket_width: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; offset: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; origin: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; offset: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; origin: string; ts: string }; Returns: string }
        | {
            Args: {
              bucket_width: string;
              offset?: string;
              origin?: string;
              timezone: string;
              ts: string;
            };
            Returns: string;
          }
        | { Args: { bucket_width: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; offset: string; ts: string }; Returns: string }
        | { Args: { bucket_width: string; origin: string; ts: string }; Returns: string }
        | { Args: { bucket_width: number; ts: number }; Returns: number }
        | { Args: { bucket_width: number; offset: number; ts: number }; Returns: number };
      time_bucket_gapfill:
        | {
            Args: { bucket_width: number; finish?: number; start?: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: number; finish?: number; start?: number; ts: number };
            Returns: number;
          }
        | {
            Args: { bucket_width: string; finish?: string; start?: string; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: string; finish?: string; start?: string; ts: string };
            Returns: string;
          }
        | {
            Args: {
              bucket_width: string;
              finish?: string;
              start?: string;
              timezone: string;
              ts: string;
            };
            Returns: string;
          }
        | {
            Args: { bucket_width: string; finish?: string; start?: string; ts: string };
            Returns: string;
          }
        | {
            Args: { bucket_width: number; finish?: number; start?: number; ts: number };
            Returns: number;
          };
      timescaledb_fdw_handler: { Args: Record<PropertyKey, never>; Returns: unknown };
      timescaledb_post_restore: { Args: Record<PropertyKey, never>; Returns: boolean };
      timescaledb_pre_restore: { Args: Record<PropertyKey, never>; Returns: boolean };
      update_subaccount: { Args: { _currency: string; _id: string }; Returns: undefined };
      update_transaction_balances: {
        Args: { _subaccount_id: string; amounttoadd: number; fromdate: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_category: 'checking' | 'investment';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_category: ['checking', 'investment'],
    },
  },
} as const;
