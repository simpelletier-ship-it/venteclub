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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          date: string
          excerpt: string
          id: string
          image: string
          published: boolean
          read_time: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          date?: string
          excerpt: string
          id?: string
          image: string
          published?: boolean
          read_time?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          date?: string
          excerpt?: string
          id?: string
          image?: string
          published?: boolean
          read_time?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_edit_proposals: {
        Row: {
          business_id: string
          created_at: string
          id: string
          proposed_changes: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          proposed_changes: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          proposed_changes?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_edit_proposals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_favorites: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_inquiries: {
        Row: {
          business_id: string
          buyer_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          business_id: string
          buyer_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          business_id?: string
          buyer_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_inquiries_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_photos: {
        Row: {
          business_id: string
          created_at: string | null
          display_order: number | null
          id: string
          photo_url: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reports: {
        Row: {
          business_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          annual_revenue: number | null
          approval_status: string | null
          asking_price: number
          baiia: number | null
          city: string | null
          created_at: string | null
          currency: string | null
          description: string
          employees_count: number | null
          featured: boolean | null
          id: string
          industry: Database["public"]["Enums"]["industry_type_new"]
          is_franchise: boolean | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          profit_margin: number | null
          province: string | null
          region: string | null
          rejection_reason: string | null
          seller_id: string
          seller_name: string | null
          seller_phone: string | null
          sold_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          withdrawal_reason: string | null
          year_established: number | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          approval_status?: string | null
          asking_price: number
          baiia?: number | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employees_count?: number | null
          featured?: boolean | null
          id?: string
          industry: Database["public"]["Enums"]["industry_type_new"]
          is_franchise?: boolean | null
          is_premium?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          profit_margin?: number | null
          province?: string | null
          region?: string | null
          rejection_reason?: string | null
          seller_id: string
          seller_name?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          withdrawal_reason?: string | null
          year_established?: number | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          approval_status?: string | null
          asking_price?: number
          baiia?: number | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employees_count?: number | null
          featured?: boolean | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type_new"]
          is_franchise?: boolean | null
          is_premium?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          profit_margin?: number | null
          province?: string | null
          region?: string | null
          rejection_reason?: string | null
          seller_id?: string
          seller_name?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          withdrawal_reason?: string | null
          year_established?: number | null
        }
        Relationships: []
      }
      contact_access: {
        Row: {
          business_id: string
          created_at: string
          id: string
          used_token: boolean
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          used_token?: boolean
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          used_token?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_access_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          currency: string
          featured_until: string
          id: string
          payment_status: string
          user_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          currency?: string
          featured_until: string
          id?: string
          payment_status?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          currency?: string
          featured_until?: string
          id?: string
          payment_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          id?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_public: boolean | null
          last_name: string | null
          marketing_emails: boolean | null
          newsletter_enabled: boolean | null
          phone: string | null
          postal_code: string | null
          province: string | null
          street_address: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_public?: boolean | null
          last_name?: string | null
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_public?: boolean | null
          last_name?: string | null
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          street_address?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          account_locked_until: string | null
          backup_codes: string[] | null
          created_at: string | null
          failed_login_attempts: number | null
          force_password_reset: boolean | null
          last_failed_login: string | null
          last_password_change: string | null
          security_questions: Json | null
          session_timeout_minutes: number | null
          trusted_devices: Json | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          force_password_reset?: boolean | null
          last_failed_login?: string | null
          last_password_change?: string | null
          security_questions?: Json | null
          session_timeout_minutes?: number | null
          trusted_devices?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          force_password_reset?: boolean | null
          last_failed_login?: string | null
          last_password_change?: string | null
          security_questions?: Json | null
          session_timeout_minutes?: number | null
          trusted_devices?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          phone: string | null
          seller_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          seller_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          seller_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          credits: number
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          credits: number
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          credits?: number
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string
          category: string | null
          city: string | null
          created_at: string
          email_enabled: boolean
          id: string
          user_id: string
        }
        Insert: {
          alert_type: string
          category?: string | null
          city?: string | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          category?: string | null
          city?: string | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          credits_remaining: number
          expires_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining: number
          expires_at: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          expires_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          created_at: string
          id: string
          last_token_refresh: string
          tokens_available: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_token_refresh?: string
          tokens_available?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_token_refresh?: string
          tokens_available?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_sold_businesses: { Args: never; Returns: undefined }
      check_business_access: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      create_demo_businesses: { Args: never; Returns: undefined }
      create_sample_businesses: { Args: never; Returns: undefined }
      get_next_access_time: { Args: { user_uuid: string }; Returns: Json }
      has_contact_access: { Args: { business_uuid: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_locked: { Args: { user_email: string }; Returns: boolean }
      is_business_featured: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      sync_premium_subscription: {
        Args: {
          p_current_period_end: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      use_token_for_access: { Args: { business_uuid: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      industry_type_new:
        | "activite_sport_loisir"
        | "art_spectacle_cinema"
        | "hebergement"
        | "bar_bistro_discotheque"
        | "batiment_immeuble"
        | "beaute_esthetique"
        | "boutique_commerce_detail"
        | "camping"
        | "centre_equestre_erabliere"
        | "transport_entreposage"
        | "construction_excavation_renovation"
        | "developpement_domaine"
        | "distribution_commerce_gros"
        | "domaine_alimentaire"
        | "communications_informatique"
        | "education_garderie"
        | "entreprise_service"
        | "entreprise_saisonniere"
        | "epicerie_depanneur"
        | "franchise"
        | "garage_mecanique_concessionnaire"
        | "immeuble_revenus"
        | "industrie_manufacturier_transformation"
        | "jardin_pepiniere_verger_vignoble"
        | "pourvoirie_centre_plein_air"
        | "residence_sante"
        | "residentiel"
        | "restaurant"
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
      app_role: ["admin", "user"],
      industry_type_new: [
        "activite_sport_loisir",
        "art_spectacle_cinema",
        "hebergement",
        "bar_bistro_discotheque",
        "batiment_immeuble",
        "beaute_esthetique",
        "boutique_commerce_detail",
        "camping",
        "centre_equestre_erabliere",
        "transport_entreposage",
        "construction_excavation_renovation",
        "developpement_domaine",
        "distribution_commerce_gros",
        "domaine_alimentaire",
        "communications_informatique",
        "education_garderie",
        "entreprise_service",
        "entreprise_saisonniere",
        "epicerie_depanneur",
        "franchise",
        "garage_mecanique_concessionnaire",
        "immeuble_revenus",
        "industrie_manufacturier_transformation",
        "jardin_pepiniere_verger_vignoble",
        "pourvoirie_centre_plein_air",
        "residence_sante",
        "residentiel",
        "restaurant",
      ],
    },
  },
} as const
