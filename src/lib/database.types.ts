export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
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
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          messages_used: number;
          period_start: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          messages_used?: number;
          period_start: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          messages_used?: number;
          period_start?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: {
          created_at: string;
          done_at: string | null;
          due_date: string | null;
          id: string;
          is_done: boolean;
          notes: string | null;
          sort_order: number;
          source_id: string | null;
          source_type: Database["public"]["Enums"]["checklist_source"];
          title: string;
          updated_at: string;
          user_plan_id: string;
        };
        Insert: {
          created_at?: string;
          done_at?: string | null;
          due_date?: string | null;
          id?: string;
          is_done?: boolean;
          notes?: string | null;
          sort_order?: number;
          source_id?: string | null;
          source_type: Database["public"]["Enums"]["checklist_source"];
          title: string;
          updated_at?: string;
          user_plan_id: string;
        };
        Update: {
          created_at?: string;
          done_at?: string | null;
          due_date?: string | null;
          id?: string;
          is_done?: boolean;
          notes?: string | null;
          sort_order?: number;
          source_id?: string | null;
          source_type?: Database["public"]["Enums"]["checklist_source"];
          title?: string;
          updated_at?: string;
          user_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_user_plan_id_fkey";
            columns: ["user_plan_id"];
            isOneToOne: false;
            referencedRelation: "user_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      content_changes: {
        Row: {
          action: string;
          after: Json | null;
          before: Json | null;
          changed_by: string | null;
          changed_fields: string[];
          created_at: string;
          id: string;
          is_substantive: boolean;
          pathway_id: string | null;
          record_id: string;
          table_name: string;
          updated_at: string;
        };
        Insert: {
          action: string;
          after?: Json | null;
          before?: Json | null;
          changed_by?: string | null;
          changed_fields?: string[];
          created_at?: string;
          id?: string;
          is_substantive?: boolean;
          pathway_id?: string | null;
          record_id: string;
          table_name: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          after?: Json | null;
          before?: Json | null;
          changed_by?: string | null;
          changed_fields?: string[];
          created_at?: string;
          id?: string;
          is_substantive?: boolean;
          pathway_id?: string | null;
          record_id?: string;
          table_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_changes_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      cost_items: {
        Row: {
          amount_max: number | null;
          amount_min: number;
          created_at: string;
          currency: string;
          id: string;
          is_estimate: boolean;
          is_mandatory: boolean;
          label_pt: string;
          last_verified_at: string;
          pathway_id: string;
          sort_order: number;
          source_url: string;
          updated_at: string;
        };
        Insert: {
          amount_max?: number | null;
          amount_min: number;
          created_at?: string;
          currency: string;
          id?: string;
          is_estimate?: boolean;
          is_mandatory?: boolean;
          label_pt: string;
          last_verified_at: string;
          pathway_id: string;
          sort_order?: number;
          source_url: string;
          updated_at?: string;
        };
        Update: {
          amount_max?: number | null;
          amount_min?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          is_estimate?: boolean;
          is_mandatory?: boolean;
          label_pt?: string;
          last_verified_at?: string;
          pathway_id?: string;
          sort_order?: number;
          source_url?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cost_items_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      countries: {
        Row: {
          code: string;
          created_at: string;
          currency: string;
          id: string;
          is_active: boolean;
          name_pt: string;
          official_site_url: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          currency: string;
          id?: string;
          is_active?: boolean;
          name_pt: string;
          official_site_url: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          is_active?: boolean;
          name_pt?: string;
          official_site_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          created_at: string;
          description_pt: string | null;
          id: string;
          name_pt: string;
          needs_apostille: boolean;
          needs_translation: boolean;
          pathway_id: string;
          sort_order: number;
          source_url: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_pt?: string | null;
          id?: string;
          name_pt: string;
          needs_apostille?: boolean;
          needs_translation?: boolean;
          pathway_id: string;
          sort_order?: number;
          source_url: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description_pt?: string | null;
          id?: string;
          name_pt?: string;
          needs_apostille?: boolean;
          needs_translation?: boolean;
          pathway_id?: string;
          sort_order?: number;
          source_url?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          anonymous_id: string | null;
          created_at: string;
          id: string;
          name: string;
          path: string | null;
          props: NonNullable<Json>;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          anonymous_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          path?: string | null;
          props?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          path?: string | null;
          props?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          brl_rate: number;
          created_at: string;
          currency: string;
          fetched_at: string;
          id: string;
          source: string;
          updated_at: string;
        };
        Insert: {
          brl_rate: number;
          created_at?: string;
          currency: string;
          fetched_at: string;
          id?: string;
          source: string;
          updated_at?: string;
        };
        Update: {
          brl_rate?: number;
          created_at?: string;
          currency?: string;
          fetched_at?: string;
          id?: string;
          source?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      occupations: {
        Row: {
          code: string;
          country_id: string;
          created_at: string;
          id: string;
          list_name: string;
          name_en: string;
          name_pt: string | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          country_id: string;
          created_at?: string;
          id?: string;
          list_name: string;
          name_en: string;
          name_pt?: string | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          country_id?: string;
          created_at?: string;
          id?: string;
          list_name?: string;
          name_en?: string;
          name_pt?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "occupations_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
      pathway_steps: {
        Row: {
          created_at: string;
          description_pt: string | null;
          estimated_duration_text: string | null;
          id: string;
          pathway_id: string;
          source_url: string;
          step_order: number;
          title_pt: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_pt?: string | null;
          estimated_duration_text?: string | null;
          id?: string;
          pathway_id: string;
          source_url: string;
          step_order: number;
          title_pt: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description_pt?: string | null;
          estimated_duration_text?: string | null;
          id?: string;
          pathway_id?: string;
          source_url?: string;
          step_order?: number;
          title_pt?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pathway_steps_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      pathways: {
        Row: {
          category: Database["public"]["Enums"]["pathway_category"];
          country_id: string;
          created_at: string;
          draft_reason: string | null;
          id: string;
          last_verified_at: string | null;
          leads_to_residence: boolean;
          name_pt: string;
          official_name: string;
          official_url: string;
          points_calculator_url: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          summary_pt: string;
          typical_duration_text: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          category: Database["public"]["Enums"]["pathway_category"];
          country_id: string;
          created_at?: string;
          draft_reason?: string | null;
          id?: string;
          last_verified_at?: string | null;
          leads_to_residence?: boolean;
          name_pt: string;
          official_name: string;
          official_url: string;
          points_calculator_url?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary_pt: string;
          typical_duration_text?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          category?: Database["public"]["Enums"]["pathway_category"];
          country_id?: string;
          created_at?: string;
          draft_reason?: string | null;
          id?: string;
          last_verified_at?: string | null;
          leads_to_residence?: boolean;
          name_pt?: string;
          official_name?: string;
          official_url?: string;
          points_calculator_url?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary_pt?: string;
          typical_duration_text?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pathways_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          budget_brl: number | null;
          created_at: string;
          education_level: Database["public"]["Enums"]["education_level"] | null;
          english_level: Database["public"]["Enums"]["english_level"] | null;
          english_lowest_component: number | null;
          english_score: number | null;
          english_test: Database["public"]["Enums"]["english_test"] | null;
          goal: Database["public"]["Enums"]["user_goal"] | null;
          has_children: boolean | null;
          id: string;
          marital_status: Database["public"]["Enums"]["marital_status"] | null;
          occupation_id: string | null;
          occupation_text: string | null;
          onboarding_completed_at: string | null;
          role: Database["public"]["Enums"]["user_role"];
          target_countries: string[];
          updated_at: string;
          user_id: string;
          years_experience: number | null;
        };
        Insert: {
          birth_date?: string | null;
          budget_brl?: number | null;
          created_at?: string;
          education_level?: Database["public"]["Enums"]["education_level"] | null;
          english_level?: Database["public"]["Enums"]["english_level"] | null;
          english_lowest_component?: number | null;
          english_score?: number | null;
          english_test?: Database["public"]["Enums"]["english_test"] | null;
          goal?: Database["public"]["Enums"]["user_goal"] | null;
          has_children?: boolean | null;
          id?: string;
          marital_status?: Database["public"]["Enums"]["marital_status"] | null;
          occupation_id?: string | null;
          occupation_text?: string | null;
          onboarding_completed_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          target_countries?: string[];
          updated_at?: string;
          user_id: string;
          years_experience?: number | null;
        };
        Update: {
          birth_date?: string | null;
          budget_brl?: number | null;
          created_at?: string;
          education_level?: Database["public"]["Enums"]["education_level"] | null;
          english_level?: Database["public"]["Enums"]["english_level"] | null;
          english_lowest_component?: number | null;
          english_score?: number | null;
          english_test?: Database["public"]["Enums"]["english_test"] | null;
          goal?: Database["public"]["Enums"]["user_goal"] | null;
          has_children?: boolean | null;
          id?: string;
          marital_status?: Database["public"]["Enums"]["marital_status"] | null;
          occupation_id?: string | null;
          occupation_text?: string | null;
          onboarding_completed_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          target_countries?: string[];
          updated_at?: string;
          user_id?: string;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_occupation_id_fkey";
            columns: ["occupation_id"];
            isOneToOne: false;
            referencedRelation: "occupations";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: {
          created_at: string;
          hits: number;
          key: string;
          updated_at: string;
          window_start: string;
        };
        Insert: {
          created_at?: string;
          hits?: number;
          key: string;
          updated_at?: string;
          window_start: string;
        };
        Update: {
          created_at?: string;
          hits?: number;
          key?: string;
          updated_at?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      requirements: {
        Row: {
          created_at: string;
          description_pt: string | null;
          id: string;
          is_hard: boolean;
          key: string;
          label_pt: string;
          last_verified_at: string;
          pathway_id: string;
          rule: NonNullable<Json>;
          sort_order: number;
          source_url: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_pt?: string | null;
          id?: string;
          is_hard?: boolean;
          key: string;
          label_pt: string;
          last_verified_at: string;
          pathway_id: string;
          rule: NonNullable<Json>;
          sort_order?: number;
          source_url: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description_pt?: string | null;
          id?: string;
          is_hard?: boolean;
          key?: string;
          label_pt?: string;
          last_verified_at?: string;
          pathway_id?: string;
          rule?: NonNullable<Json>;
          sort_order?: number;
          source_url?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requirements_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      source_chunks: {
        Row: {
          chunk_index: number;
          content: string;
          content_hash: string;
          created_at: string;
          embedding: string;
          embedding_model: string;
          fetched_at: string;
          id: string;
          origin: Database["public"]["Enums"]["chunk_origin"];
          pathway_id: string;
          title: string | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          chunk_index: number;
          content: string;
          content_hash: string;
          created_at?: string;
          embedding: string;
          embedding_model: string;
          fetched_at: string;
          id?: string;
          origin: Database["public"]["Enums"]["chunk_origin"];
          pathway_id: string;
          title?: string | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          content_hash?: string;
          created_at?: string;
          embedding?: string;
          embedding_model?: string;
          fetched_at?: string;
          id?: string;
          origin?: Database["public"]["Enums"]["chunk_origin"];
          pathway_id?: string;
          title?: string | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_chunks_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_events: {
        Row: {
          created_at: string;
          id: string;
          processed_at: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          processed_at?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          processed_at?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          billing_kind: string | null;
          created_at: string;
          current_period_end: string | null;
          id: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          status: string | null;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          billing_kind?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          billing_kind?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_plans: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          pathway_id: string;
          pathway_version: number;
          simulator: NonNullable<Json>;
          status: Database["public"]["Enums"]["plan_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          pathway_id: string;
          pathway_version?: number;
          simulator?: NonNullable<Json>;
          status?: Database["public"]["Enums"]["plan_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          pathway_id?: string;
          pathway_version?: number;
          simulator?: NonNullable<Json>;
          status?: Database["public"]["Enums"]["plan_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_plans_pathway_id_fkey";
            columns: ["pathway_id"];
            isOneToOne: false;
            referencedRelation: "pathways";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_funnel: {
        Args: { p_days?: number };
        Returns: {
          people: number;
          step: string;
        }[];
      };
      admin_retention: {
        Args: { p_weeks?: number };
        Returns: {
          active: number;
          cohort: string;
          size: number;
          week: number;
        }[];
      };
      ai_period_start: { Args: Record<PropertyKey, never>; Returns: string };
      consume_ai_message: {
        Args: { p_limit: number; p_user: string };
        Returns: {
          allowed: boolean;
          quota: number;
          used: number;
        }[];
      };
      hit_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_pro: { Args: { target?: string }; Returns: boolean };
      match_source_chunks: {
        Args: {
          match_count?: number;
          model: string;
          pathway_ids: string[];
          query_embedding: string;
        };
        Returns: {
          content: string;
          fetched_at: string;
          id: string;
          origin: Database["public"]["Enums"]["chunk_origin"];
          pathway_id: string;
          similarity: number;
          title: string;
          url: string;
        }[];
      };
      pathway_changes_since: {
        Args: { p_pathway: string; p_since: string };
        Returns: {
          action: string;
          changed_at: string;
          changed_fields: string[];
          table_name: string;
        }[];
      };
      refund_ai_message: { Args: { p_user: string }; Returns: undefined };
    };
    Enums: {
      checklist_source: "step" | "document" | "custom";
      chunk_origin: "official_page" | "curated";
      content_status: "draft" | "published" | "archived";
      education_level:
        "none" | "high_school" | "technical" | "bachelor" | "postgraduate" | "master" | "doctorate";
      english_level: "none" | "basic" | "intermediate" | "advanced" | "fluent";
      english_test: "IELTS" | "PTE" | "TOEFL" | "CELPIP" | "Duolingo";
      marital_status: "single" | "married" | "stable_union" | "divorced" | "widowed";
      pathway_category: "work" | "study" | "residence" | "working_holiday";
      plan_status: "exploring" | "preparing" | "applied" | "paused" | "done";
      subscription_plan: "free" | "pro";
      user_goal: "work" | "study" | "residence";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      checklist_source: ["step", "document", "custom"],
      chunk_origin: ["official_page", "curated"],
      content_status: ["draft", "published", "archived"],
      education_level: [
        "none",
        "high_school",
        "technical",
        "bachelor",
        "postgraduate",
        "master",
        "doctorate",
      ],
      english_level: ["none", "basic", "intermediate", "advanced", "fluent"],
      english_test: ["IELTS", "PTE", "TOEFL", "CELPIP", "Duolingo"],
      marital_status: ["single", "married", "stable_union", "divorced", "widowed"],
      pathway_category: ["work", "study", "residence", "working_holiday"],
      plan_status: ["exploring", "preparing", "applied", "paused", "done"],
      subscription_plan: ["free", "pro"],
      user_goal: ["work", "study", "residence"],
      user_role: ["user", "admin"],
    },
  },
} as const;
