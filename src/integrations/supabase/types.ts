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
      businesses: {
        Row: {
          address: string | null
          annual_revenue: number | null
          asking_price: number
          city: string | null
          created_at: string | null
          currency: string | null
          description: string
          employees_count: number | null
          featured: boolean | null
          id: string
          industry: Database["public"]["Enums"]["industry_type_new"]
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          profit_margin: number | null
          province: string | null
          seller_id: string
          seller_name: string | null
          seller_phone: string | null
          sold_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          year_established: number | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          asking_price: number
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employees_count?: number | null
          featured?: boolean | null
          id?: string
          industry: Database["public"]["Enums"]["industry_type_new"]
          is_premium?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          profit_margin?: number | null
          province?: string | null
          seller_id: string
          seller_name?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          year_established?: number | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          asking_price?: number
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employees_count?: number | null
          featured?: boolean | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type_new"]
          is_premium?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          profit_margin?: number | null
          province?: string | null
          seller_id?: string
          seller_name?: string | null
          seller_phone?: string | null
          sold_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "seller_contacts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_business_access: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      is_business_featured: {
        Args: { business_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
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
