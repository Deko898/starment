/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content_text: string;
          id: string;
          sender_id: string;
          sent_at: string | null;
          session_id: string;
        };
        Insert: {
          content_text: string;
          id?: string;
          sender_id: string;
          sent_at?: string | null;
          session_id: string;
        };
        Update: {
          content_text?: string;
          id?: string;
          sender_id?: string;
          sent_at?: string | null;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_sessions: {
        Row: {
          duration_minutes: number | null;
          ended_at: string | null;
          id: string;
          is_active: boolean | null;
          order_id: string;
          started_at: string | null;
        };
        Insert: {
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          order_id: string;
          started_at?: string | null;
        };
        Update: {
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          order_id?: string;
          started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_sessions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'chat_sessions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'chat_sessions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      completion_artifacts: {
        Row: {
          artifact_type: string;
          artifact_url: string | null;
          completion_id: string;
          created_at: string | null;
          id: string;
        };
        Insert: {
          artifact_type: string;
          artifact_url?: string | null;
          completion_id: string;
          created_at?: string | null;
          id?: string;
        };
        Update: {
          artifact_type?: string;
          artifact_url?: string | null;
          completion_id?: string;
          created_at?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'completion_artifacts_completion_id_fkey';
            columns: ['completion_id'];
            isOneToOne: false;
            referencedRelation: 'order_completions';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_availability: {
        Row: {
          created_at: string | null;
          creator_id: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean | null;
          start_time: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          start_time: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          start_time?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'creator_availability_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'creator_availability_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_commercial: {
        Row: {
          charges_enabled: boolean | null;
          created_at: string | null;
          creator_id: string;
          creator_status: string | null;
          kyc_submitted_at: string | null;
          kyc_verified: boolean | null;
          onboarding_status: string | null;
          payouts_enabled: boolean | null;
          review_notes: string | null;
          stripe_connect_account_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          charges_enabled?: boolean | null;
          created_at?: string | null;
          creator_id: string;
          creator_status?: string | null;
          kyc_submitted_at?: string | null;
          kyc_verified?: boolean | null;
          onboarding_status?: string | null;
          payouts_enabled?: boolean | null;
          review_notes?: string | null;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          charges_enabled?: boolean | null;
          created_at?: string | null;
          creator_id?: string;
          creator_status?: string | null;
          kyc_submitted_at?: string | null;
          kyc_verified?: boolean | null;
          onboarding_status?: string | null;
          payouts_enabled?: boolean | null;
          review_notes?: string | null;
          stripe_connect_account_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'creator_commercial_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: true;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'creator_commercial_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_profile: {
        Row: {
          category_id: string;
          created_at: string | null;
          creator_id: string;
          follower_count: number;
          is_visible: boolean | null;
          largest_following_platform: string;
          legal_name: string;
          profession: string | null;
          response_time_hours: number | null;
          social_handle: string;
          updated_at: string | null;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          creator_id: string;
          follower_count: number;
          is_visible?: boolean | null;
          largest_following_platform: string;
          legal_name: string;
          profession?: string | null;
          response_time_hours?: number | null;
          social_handle: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          creator_id?: string;
          follower_count?: number;
          is_visible?: boolean | null;
          largest_following_platform?: string;
          legal_name?: string;
          profession?: string | null;
          response_time_hours?: number | null;
          social_handle?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'creator_profile_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'creator_profile_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: true;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'creator_profile_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      health_check: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          ok: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          ok?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          ok?: boolean | null;
        };
        Relationships: [];
      };
      order_addons: {
        Row: {
          addon_id: string;
          created_at: string | null;
          id: string;
          order_id: string;
          price_cents: number;
        };
        Insert: {
          addon_id: string;
          created_at?: string | null;
          id?: string;
          order_id: string;
          price_cents: number;
        };
        Update: {
          addon_id?: string;
          created_at?: string | null;
          id?: string;
          order_id?: string;
          price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_addons_addon_id_fkey';
            columns: ['addon_id'];
            isOneToOne: false;
            referencedRelation: 'creator_product_addons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_addons_addon_id_fkey';
            columns: ['addon_id'];
            isOneToOne: false;
            referencedRelation: 'product_addons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_addons_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'order_addons_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'order_addons_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      order_completions: {
        Row: {
          created_at: string | null;
          id: string;
          label: string;
          order_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          label: string;
          order_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          label?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_completions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'order_completions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'order_completions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          creator_id: string;
          currency_code: string | null;
          delivered_url: string | null;
          escrow_status: Database['public']['Enums']['escrow_status_enum'];
          fan_id: string;
          id: string;
          instructions: string | null;
          occasion: string | null;
          price_cents: number;
          product_id: string;
          scheduled_at: string | null;
          status: Database['public']['Enums']['order_status_enum'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id: string;
          currency_code?: string | null;
          delivered_url?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'];
          fan_id: string;
          id?: string;
          instructions?: string | null;
          occasion?: string | null;
          price_cents: number;
          product_id: string;
          scheduled_at?: string | null;
          status?: Database['public']['Enums']['order_status_enum'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string;
          currency_code?: string | null;
          delivered_url?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'];
          fan_id?: string;
          id?: string;
          instructions?: string | null;
          occasion?: string | null;
          price_cents?: number;
          product_id?: string;
          scheduled_at?: string | null;
          status?: Database['public']['Enums']['order_status_enum'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'creator_products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_addons: {
        Row: {
          addon_type: Database['public']['Enums']['addon_type_enum'];
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          price_cents: number;
          product_id: string;
          updated_at: string | null;
        };
        Insert: {
          addon_type: Database['public']['Enums']['addon_type_enum'];
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          price_cents: number;
          product_id: string;
          updated_at?: string | null;
        };
        Update: {
          addon_type?: Database['public']['Enums']['addon_type_enum'];
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          price_cents?: number;
          product_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_addons_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'creator_products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_addons_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          created_at: string | null;
          creator_id: string;
          currency_code: string | null;
          delivery_time_hours: number | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_active: boolean | null;
          license_days: number | null;
          license_extend_price_cents: number | null;
          price_cents: number;
          product_type: Database['public']['Enums']['product_type_enum'];
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id: string;
          currency_code?: string | null;
          delivery_time_hours?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          license_days?: number | null;
          license_extend_price_cents?: number | null;
          price_cents: number;
          product_type: Database['public']['Enums']['product_type_enum'];
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string;
          currency_code?: string | null;
          delivery_time_hours?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean | null;
          license_days?: number | null;
          license_extend_price_cents?: number | null;
          price_cents?: number;
          product_type?: Database['public']['Enums']['product_type_enum'];
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country_code: string;
          created_at: string | null;
          date_of_birth: string | null;
          display_name: string;
          id: string;
          phone: string | null;
          role: Database['public']['Enums']['role_enum'];
          search_tsv: unknown | null;
          updated_at: string | null;
          user_type: Database['public']['Enums']['user_type_enum'];
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code: string;
          created_at?: string | null;
          date_of_birth?: string | null;
          display_name: string;
          id: string;
          phone?: string | null;
          role?: Database['public']['Enums']['role_enum'];
          search_tsv?: unknown | null;
          updated_at?: string | null;
          user_type?: Database['public']['Enums']['user_type_enum'];
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code?: string;
          created_at?: string | null;
          date_of_birth?: string | null;
          display_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['role_enum'];
          search_tsv?: unknown | null;
          updated_at?: string | null;
          user_type?: Database['public']['Enums']['user_type_enum'];
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          blocked_id: string | null;
          blocker_id: string | null;
          created_at: string | null;
          id: string;
          reason: string | null;
        };
        Insert: {
          blocked_id?: string | null;
          blocker_id?: string | null;
          created_at?: string | null;
          id?: string;
          reason?: string | null;
        };
        Update: {
          blocked_id?: string | null;
          blocker_id?: string | null;
          created_at?: string | null;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_flags: {
        Row: {
          created_at: string | null;
          id: string;
          reason: string | null;
          status: Database['public']['Enums']['user_status_enum'];
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          reason?: string | null;
          status?: Database['public']['Enums']['user_status_enum'];
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          reason?: string | null;
          status?: Database['public']['Enums']['user_status_enum'];
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_flags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_flags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          language: string | null;
          timezone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          language?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          language?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      video_call_bookings: {
        Row: {
          created_at: string | null;
          creator_id: string;
          end_at: string;
          fan_id: string;
          id: string;
          order_id: string;
          start_at: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id: string;
          end_at: string;
          fan_id: string;
          id?: string;
          order_id: string;
          start_at: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string;
          end_at?: string;
          fan_id?: string;
          id?: string;
          order_id?: string;
          start_at?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      creator_bookings: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          end_at: string | null;
          fan_id: string | null;
          id: string | null;
          order_id: string | null;
          start_at: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          end_at?: string | null;
          fan_id?: string | null;
          id?: string | null;
          order_id?: string | null;
          start_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          end_at?: string | null;
          fan_id?: string | null;
          id?: string | null;
          order_id?: string | null;
          start_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_chat_messages: {
        Row: {
          content_text: string | null;
          id: string | null;
          sender_id: string | null;
          sent_at: string | null;
          session_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_orders: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          currency_code: string | null;
          escrow_status: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id: string | null;
          order_id: string | null;
          price_cents: number | null;
          product_id: string | null;
          status: Database['public']['Enums']['order_status_enum'] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id?: string | null;
          order_id?: string | null;
          price_cents?: number | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['order_status_enum'] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id?: string | null;
          order_id?: string | null;
          price_cents?: number | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['order_status_enum'] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'creator_products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_product_addons: {
        Row: {
          addon_type: Database['public']['Enums']['addon_type_enum'] | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          is_active: boolean | null;
          price_cents: number | null;
          product_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          addon_type?: Database['public']['Enums']['addon_type_enum'] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          price_cents?: number | null;
          product_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          addon_type?: Database['public']['Enums']['addon_type_enum'] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          price_cents?: number | null;
          product_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_addons_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'creator_products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_addons_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_products: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          currency_code: string | null;
          description: string | null;
          is_active: boolean | null;
          price_cents: number | null;
          product_id: string | null;
          product_type: Database['public']['Enums']['product_type_enum'] | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          description?: string | null;
          is_active?: boolean | null;
          price_cents?: number | null;
          product_id?: string | null;
          product_type?: Database['public']['Enums']['product_type_enum'] | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          description?: string | null;
          is_active?: boolean | null;
          price_cents?: number | null;
          product_id?: string | null;
          product_type?: Database['public']['Enums']['product_type_enum'] | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      creator_public_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          display_name: string | null;
          id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          display_name?: string | null;
          id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          display_name?: string | null;
          id?: string | null;
        };
        Relationships: [];
      };
      fan_bookings: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          end_at: string | null;
          fan_id: string | null;
          id: string | null;
          order_id: string | null;
          start_at: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          end_at?: string | null;
          fan_id?: string | null;
          id?: string | null;
          order_id?: string | null;
          start_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          end_at?: string | null;
          fan_id?: string | null;
          id?: string | null;
          order_id?: string | null;
          start_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'creator_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'fan_orders';
            referencedColumns: ['order_id'];
          },
          {
            foreignKeyName: 'video_call_bookings_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      fan_chat_messages: {
        Row: {
          content_text: string | null;
          id: string | null;
          sender_id: string | null;
          sent_at: string | null;
          session_id: string | null;
        };
        Insert: {
          content_text?: string | null;
          id?: string | null;
          sender_id?: string | null;
          sent_at?: string | null;
          session_id?: string | null;
        };
        Update: {
          content_text?: string | null;
          id?: string | null;
          sender_id?: string | null;
          sent_at?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      fan_orders: {
        Row: {
          created_at: string | null;
          creator_id: string | null;
          currency_code: string | null;
          escrow_status: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id: string | null;
          order_id: string | null;
          price_cents: number | null;
          product_id: string | null;
          status: Database['public']['Enums']['order_status_enum'] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id?: string | null;
          order_id?: string | null;
          price_cents?: number | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['order_status_enum'] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          creator_id?: string | null;
          currency_code?: string | null;
          escrow_status?: Database['public']['Enums']['escrow_status_enum'] | null;
          fan_id?: string | null;
          order_id?: string | null;
          price_cents?: number | null;
          product_id?: string | null;
          status?: Database['public']['Enums']['order_status_enum'] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'creator_public_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_fan_id_fkey';
            columns: ['fan_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'creator_products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      update_profile: {
        Args: {
          p_avatar_url: string;
          p_bio: string;
          p_country_code: string;
          p_display_name: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      addon_type_enum: 'screenshot' | 'digital_signature';
      escrow_status_enum: 'pending' | 'released' | 'refunded' | 'partial';
      order_status_enum: 'pending' | 'accepted' | 'delivered' | 'completed' | 'cancelled';
      product_type_enum:
        | 'personal_video'
        | 'personal_message'
        | 'video_call'
        | 'chat'
        | 'business_video';
      role_enum: 'user' | 'admin';
      user_status_enum: 'active' | 'suspended' | 'banned';
      user_type_enum: 'fan' | 'creator';
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      addon_type_enum: ['screenshot', 'digital_signature'],
      escrow_status_enum: ['pending', 'released', 'refunded', 'partial'],
      order_status_enum: ['pending', 'accepted', 'delivered', 'completed', 'cancelled'],
      product_type_enum: [
        'personal_video',
        'personal_message',
        'video_call',
        'chat',
        'business_video',
      ],
      role_enum: ['user', 'admin'],
      user_status_enum: ['active', 'suspended', 'banned'],
      user_type_enum: ['fan', 'creator'],
    },
  },
} as const;
