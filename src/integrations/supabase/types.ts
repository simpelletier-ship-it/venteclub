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
      asset_history: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          notes: string | null
          recorded_at: string
          user_id: string
          value: number
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id: string
          value: number
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "user_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          blocked_until: string | null
          failed_attempts: number | null
          id: string
          ip_address: unknown
          permanent: boolean | null
          reason: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_until?: string | null
          failed_attempts?: number | null
          id?: string
          ip_address: unknown
          permanent?: boolean | null
          reason: string
        }
        Update: {
          blocked_at?: string | null
          blocked_until?: string | null
          failed_attempts?: number | null
          id?: string
          ip_address?: unknown
          permanent?: boolean | null
          reason?: string
        }
        Relationships: []
      }
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
      budget_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_custom: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_goals: {
        Row: {
          category_id: string | null
          created_at: string
          frequency: string | null
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_insights: {
        Row: {
          action_taken: boolean | null
          created_at: string | null
          description: string
          id: string
          insight_type: string
          is_dismissed: boolean | null
          is_read: boolean | null
          priority: string
          related_category_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_taken?: boolean | null
          created_at?: string | null
          description: string
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority: string
          related_category_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_taken?: boolean | null
          created_at?: string | null
          description?: string
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string
          related_category_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_insights_related_category_id_fkey"
            columns: ["related_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_monthly_summaries: {
        Row: {
          created_at: string
          id: string
          month: string
          net_worth: number | null
          total_expenses: number | null
          total_income: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          net_worth?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          net_worth?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_reminders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          email_sent: boolean | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          push_sent: boolean | null
          recurrence_frequency: string | null
          related_goal_id: string | null
          related_transaction_id: string | null
          reminder_date: string
          reminder_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          push_sent?: boolean | null
          recurrence_frequency?: string | null
          related_goal_id?: string | null
          related_transaction_id?: string | null
          reminder_date: string
          reminder_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          push_sent?: boolean | null
          recurrence_frequency?: string | null
          related_goal_id?: string | null
          related_transaction_id?: string | null
          reminder_date?: string
          reminder_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_reminders_related_goal_id_fkey"
            columns: ["related_goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_reminders_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "budget_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean | null
          recurring_frequency: string | null
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          transaction_date: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_analytics: {
        Row: {
          business_id: string
          city: string | null
          country: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          region: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          region?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          region?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
          admin_updated_at: string | null
          annual_revenue: number | null
          approval_status: string | null
          asking_price: number
          asking_price_max: number | null
          baiia: number | null
          baiia_margin: number | null
          chat_disabled: boolean | null
          city: string | null
          created_at: string | null
          currency: string | null
          description: string
          employees_count: number | null
          featured: boolean | null
          franchise_fee: number | null
          franchise_term_years: number | null
          has_pending_changes: boolean | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          initial_investment_max: number | null
          initial_investment_min: number | null
          is_demo: boolean | null
          is_franchise: boolean | null
          is_premium: boolean | null
          is_rental_property: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          marketing_fee: number | null
          net_profit: number | null
          net_profit_margin: number | null
          pending_changes: Json | null
          pending_changes_submitted_at: string | null
          profit_margin: number | null
          property_type: string | null
          province: string | null
          region: string | null
          rejection_reason: string | null
          rental_units: Json | null
          royalty_percentage: number | null
          sale_type: Database["public"]["Enums"]["sale_type"] | null
          seller_email: string | null
          seller_id: string
          seller_name: string | null
          seller_phone: string | null
          slug: string
          sold_at: string | null
          source_url: string | null
          square_footage: number | null
          status: string | null
          territory_available: string | null
          title: string
          training_provided: boolean | null
          updated_at: string | null
          updated_by_admin: boolean | null
          views_count: number | null
          withdrawal_reason: string | null
          year_built: number | null
          year_established: number | null
        }
        Insert: {
          address?: string | null
          admin_updated_at?: string | null
          annual_revenue?: number | null
          approval_status?: string | null
          asking_price: number
          asking_price_max?: number | null
          baiia?: number | null
          baiia_margin?: number | null
          chat_disabled?: boolean | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          employees_count?: number | null
          featured?: boolean | null
          franchise_fee?: number | null
          franchise_term_years?: number | null
          has_pending_changes?: boolean | null
          id?: string
          industry: Database["public"]["Enums"]["industry_type"]
          initial_investment_max?: number | null
          initial_investment_min?: number | null
          is_demo?: boolean | null
          is_franchise?: boolean | null
          is_premium?: boolean | null
          is_rental_property?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketing_fee?: number | null
          net_profit?: number | null
          net_profit_margin?: number | null
          pending_changes?: Json | null
          pending_changes_submitted_at?: string | null
          profit_margin?: number | null
          property_type?: string | null
          province?: string | null
          region?: string | null
          rejection_reason?: string | null
          rental_units?: Json | null
          royalty_percentage?: number | null
          sale_type?: Database["public"]["Enums"]["sale_type"] | null
          seller_email?: string | null
          seller_id: string
          seller_name?: string | null
          seller_phone?: string | null
          slug: string
          sold_at?: string | null
          source_url?: string | null
          square_footage?: number | null
          status?: string | null
          territory_available?: string | null
          title: string
          training_provided?: boolean | null
          updated_at?: string | null
          updated_by_admin?: boolean | null
          views_count?: number | null
          withdrawal_reason?: string | null
          year_built?: number | null
          year_established?: number | null
        }
        Update: {
          address?: string | null
          admin_updated_at?: string | null
          annual_revenue?: number | null
          approval_status?: string | null
          asking_price?: number
          asking_price_max?: number | null
          baiia?: number | null
          baiia_margin?: number | null
          chat_disabled?: boolean | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employees_count?: number | null
          featured?: boolean | null
          franchise_fee?: number | null
          franchise_term_years?: number | null
          has_pending_changes?: boolean | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          initial_investment_max?: number | null
          initial_investment_min?: number | null
          is_demo?: boolean | null
          is_franchise?: boolean | null
          is_premium?: boolean | null
          is_rental_property?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketing_fee?: number | null
          net_profit?: number | null
          net_profit_margin?: number | null
          pending_changes?: Json | null
          pending_changes_submitted_at?: string | null
          profit_margin?: number | null
          property_type?: string | null
          province?: string | null
          region?: string | null
          rejection_reason?: string | null
          rental_units?: Json | null
          royalty_percentage?: number | null
          sale_type?: Database["public"]["Enums"]["sale_type"] | null
          seller_email?: string | null
          seller_id?: string
          seller_name?: string | null
          seller_phone?: string | null
          slug?: string
          sold_at?: string | null
          source_url?: string | null
          square_footage?: number | null
          status?: string | null
          territory_available?: string | null
          title?: string
          training_provided?: boolean | null
          updated_at?: string | null
          updated_by_admin?: boolean | null
          views_count?: number | null
          withdrawal_reason?: string | null
          year_built?: number | null
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
      debt_history: {
        Row: {
          balance: number
          created_at: string | null
          debt_id: string
          id: string
          notes: string | null
          recorded_at: string
          user_id: string
        }
        Insert: {
          balance: number
          created_at?: string | null
          debt_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          debt_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_history_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "user_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          created_at: string | null
          fingerprint_hash: string
          id: string
          ip_address: unknown
          language: string | null
          last_seen_at: string | null
          platform: string | null
          screen_resolution: string | null
          times_seen: number | null
          timezone: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash: string
          id?: string
          ip_address?: unknown
          language?: string | null
          last_seen_at?: string | null
          platform?: string | null
          screen_resolution?: string | null
          times_seen?: number | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string
          id?: string
          ip_address?: unknown
          language?: string | null
          last_seen_at?: string | null
          platform?: string | null
          screen_resolution?: string | null
          times_seen?: number | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
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
      financial_goals: {
        Row: {
          color: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          icon: string | null
          id: string
          name: string
          notes: string | null
          target_amount: number
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          name: string
          notes?: string | null
          target_amount: number
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          name?: string
          notes?: string | null
          target_amount?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          captcha_verified: boolean | null
          email: string
          failure_reason: string | null
          fingerprint_hash: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          captcha_verified?: boolean | null
          email: string
          failure_reason?: string | null
          fingerprint_hash?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          captcha_verified?: boolean | null
          email?: string
          failure_reason?: string | null
          fingerprint_hash?: string | null
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
          image_url: string | null
          reactions: Json | null
          read: boolean
          read_at: string | null
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
          voice_duration: number | null
          voice_url: string | null
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions?: Json | null
          read?: boolean
          read_at?: string | null
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          reactions?: Json | null
          read?: boolean
          read_at?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          account_approved: boolean | null
          account_approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          daily_conversations_count: number | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_public: boolean | null
          job_title: string | null
          last_conversation_date: string | null
          last_name: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          marketing_emails: boolean | null
          newsletter_enabled: boolean | null
          phone: string | null
          postal_code: string | null
          province: string | null
          response_time_hours: number | null
          seller_since: string | null
          specialties: string[] | null
          street_address: string | null
          total_responses: number | null
          updated_at: string | null
          verified_seller: boolean | null
          website: string | null
        }
        Insert: {
          account_approved?: boolean | null
          account_approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          daily_conversations_count?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_public?: boolean | null
          job_title?: string | null
          last_conversation_date?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          response_time_hours?: number | null
          seller_since?: string | null
          specialties?: string[] | null
          street_address?: string | null
          total_responses?: number | null
          updated_at?: string | null
          verified_seller?: boolean | null
          website?: string | null
        }
        Update: {
          account_approved?: boolean | null
          account_approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          daily_conversations_count?: number | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_public?: boolean | null
          job_title?: string | null
          last_conversation_date?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          response_time_hours?: number | null
          seller_since?: string | null
          specialties?: string[] | null
          street_address?: string | null
          total_responses?: number | null
          updated_at?: string | null
          verified_seller?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          identifier_type: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          identifier_type: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          identifier_type?: string
          window_start?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
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
      seller_response_stats: {
        Row: {
          created_at: string | null
          id: string
          message_id: string | null
          response_time_minutes: number
          seller_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          response_time_minutes: number
          seller_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string | null
          response_time_minutes?: number
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_response_stats_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_response_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sitemap_cache: {
        Row: {
          entry_count: number
          generated_at: string
          id: string
          xml_content: string
        }
        Insert: {
          entry_count?: number
          generated_at?: string
          id?: string
          xml_content: string
        }
        Update: {
          entry_count?: number
          generated_at?: string
          id?: string
          xml_content?: string
        }
        Relationships: []
      }
      sitemap_generation_log: {
        Row: {
          entry_count: number
          generated_at: string
          generation_time_ms: number
          id: string
          trigger_source: string
        }
        Insert: {
          entry_count: number
          generated_at?: string
          generation_time_ms: number
          id?: string
          trigger_source: string
        }
        Update: {
          entry_count?: number
          generated_at?: string
          generation_time_ms?: number
          id?: string
          trigger_source?: string
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
      transaction_tag_links: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "transaction_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tag_links_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "budget_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_templates: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          tag_ids: string[] | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tag_ids?: string[] | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tag_ids?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          id: string
          trusted_until: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          id?: string
          trusted_until: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          trusted_until?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          badge_description: string | null
          badge_name: string
          badge_type: string
          color: string | null
          earned_at: string | null
          icon: string
          id: string
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          badge_type: string
          color?: string | null
          earned_at?: string | null
          icon: string
          id?: string
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          badge_type?: string
          color?: string | null
          earned_at?: string | null
          icon?: string
          id?: string
          user_id?: string
          viewed?: boolean | null
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
      user_assets: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      user_benchmarks: {
        Row: {
          avg_monthly_amount: number
          category_name: string
          id: string
          income_bracket: string
          last_updated: string | null
          median_monthly_amount: number
          percentile_25: number
          percentile_75: number
          sample_size: number
        }
        Insert: {
          avg_monthly_amount: number
          category_name: string
          id?: string
          income_bracket: string
          last_updated?: string | null
          median_monthly_amount: number
          percentile_25: number
          percentile_75: number
          sample_size: number
        }
        Update: {
          avg_monthly_amount?: number
          category_name?: string
          id?: string
          income_bracket?: string
          last_updated?: string | null
          median_monthly_amount?: number
          percentile_25?: number
          percentile_75?: number
          sample_size?: number
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          category_id: string | null
          challenge_type: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          end_date: string
          icon: string | null
          id: string
          name: string
          progress: number | null
          start_date: string
          status: string | null
          target_value: number | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          challenge_type: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_days: number
          end_date: string
          icon?: string | null
          id?: string
          name: string
          progress?: number | null
          start_date: string
          status?: string | null
          target_value?: number | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          challenge_type?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          end_date?: string
          icon?: string | null
          id?: string
          name?: string
          progress?: number | null
          start_date?: string
          status?: string | null
          target_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_debts: {
        Row: {
          balance: number
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          interest_rate: number
          minimum_payment: number | null
          name: string
          notes: string | null
          payment_frequency: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          interest_rate: number
          minimum_payment?: number | null
          name: string
          notes?: string | null
          payment_frequency?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          minimum_payment?: number | null
          name?: string
          notes?: string | null
          payment_frequency?: string | null
          type?: string
          updated_at?: string
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
      verification_code_rate_limit: {
        Row: {
          attempts: number
          created_at: string
          email: string
          id: string
          ip_address: string | null
          window_start: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          window_start?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_pending_changes: {
        Args: { business_uuid: string }
        Returns: undefined
      }
      approve_user_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      archive_old_sold_businesses: { Args: never; Returns: undefined }
      calculate_average_response_time: {
        Args: { seller_uuid: string }
        Returns: number
      }
      can_start_conversation: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: Json
      }
      can_view_seller_contact: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      check_business_access: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_expired_trusted_devices: { Args: never; Returns: undefined }
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_demo_businesses: { Args: never; Returns: undefined }
      create_sample_businesses: { Args: never; Returns: undefined }
      generate_goal_deadline_reminders: { Args: never; Returns: undefined }
      generate_slug: { Args: { title: string }; Returns: string }
      get_business_with_secure_contact: {
        Args: { business_uuid: string }
        Returns: {
          address: string
          annual_revenue: number
          approval_status: string
          asking_price: number
          asking_price_max: number
          baiia: number
          baiia_margin: number
          city: string
          created_at: string
          currency: string
          description: string
          employees_count: number
          featured: boolean
          id: string
          industry: string
          is_demo: boolean
          is_franchise: boolean
          is_premium: boolean
          latitude: number
          location: string
          longitude: number
          net_profit: number
          net_profit_margin: number
          profit_margin: number
          province: string
          region: string
          sale_type: string
          seller_email: string
          seller_id: string
          seller_name: string
          seller_phone: string
          slug: string
          sold_at: string
          status: string
          title: string
          updated_at: string
          views_count: number
          year_established: number
        }[]
      }
      get_businesses_public: {
        Args: never
        Returns: {
          annual_revenue: number
          approval_status: string
          asking_price: number
          asking_price_max: number
          baiia: number
          city: string
          created_at: string
          currency: string
          description: string
          employees_count: number
          featured: boolean
          id: string
          industry: string
          is_franchise: boolean
          is_premium: boolean
          latitude: number
          location: string
          longitude: number
          net_profit: number
          profit_margin: number
          province: string
          region: string
          seller_id: string
          slug: string
          status: string
          title: string
          views_count: number
          year_established: number
        }[]
      }
      get_next_access_time: { Args: { user_uuid: string }; Returns: Json }
      get_public_stats: {
        Args: never
        Returns: {
          total_businesses: number
          total_users: number
          total_value: number
          total_views: number
        }[]
      }
      get_safe_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          id: string
        }[]
      }
      get_user_income_bracket: { Args: { p_user_id: string }; Returns: string }
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
      is_device_trusted: {
        Args: { p_device_fingerprint: string; p_user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string }
        Returns: undefined
      }
      reject_pending_changes: {
        Args: { business_uuid: string; rejection_reason: string }
        Returns: undefined
      }
      revoke_user_approval: {
        Args: { target_user_id: string }
        Returns: undefined
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
      trigger_auto_blog_generation: { Args: never; Returns: undefined }
      trigger_sitemap_regeneration: {
        Args: { p_source?: string }
        Returns: Json
      }
      update_business_featured_status: { Args: never; Returns: undefined }
      use_token_for_access: { Args: { business_uuid: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      industry_type:
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
      sale_type: "assets" | "shares" | "both"
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
      industry_type: [
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
      sale_type: ["assets", "shares", "both"],
    },
  },
} as const
