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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          category_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Insert: {
          category_id: string
          locale: Database["public"]["Enums"]["app_locale"]
          name: string
        }
        Update: {
          category_id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string
          created_at: string
          embedding: string
          embedding_model: string
          heading: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          metadata: Json
          post_id: string
          source_hash: string
          source_updated_at: string
          token_count: number
          updated_at: string
        }
        Insert: {
          chunk_index: number
          content: string
          content_hash: string
          created_at?: string
          embedding: string
          embedding_model: string
          heading?: string
          id?: string
          locale: Database["public"]["Enums"]["app_locale"]
          metadata?: Json
          post_id: string
          source_hash: string
          source_updated_at: string
          token_count: number
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string
          created_at?: string
          embedding?: string
          embedding_model?: string
          heading?: string
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          metadata?: Json
          post_id?: string
          source_hash?: string
          source_updated_at?: string
          token_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_post_id_locale_fkey"
            columns: ["post_id", "locale"]
            isOneToOne: false
            referencedRelation: "post_translations"
            referencedColumns: ["post_id", "locale"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_vnd: number
          order_id: string
          post_id: string | null
          product_name: string
          quantity: number
          unit_price_vnd: number
        }
        Insert: {
          id?: string
          line_total_vnd: number
          order_id: string
          post_id?: string | null
          product_name: string
          quantity: number
          unit_price_vnd: number
        }
        Update: {
          id?: string
          line_total_vnd?: number
          order_id?: string
          post_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_vnd?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "published_post_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          code: string
          created_at: string
          customer_name: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          note: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone: string
          shipping_fee_vnd: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_vnd: number
          total_vnd: number
          updated_at: string
        }
        Insert: {
          address: string
          code: string
          created_at?: string
          customer_name: string
          id?: string
          locale: Database["public"]["Enums"]["app_locale"]
          note?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone: string
          shipping_fee_vnd: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_vnd: number
          total_vnd: number
          updated_at?: string
        }
        Update: {
          address?: string
          code?: string
          created_at?: string
          customer_name?: string
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          note?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          phone?: string
          shipping_fee_vnd?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_vnd?: number
          total_vnd?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          alt: string
          created_at: string
          id: string
          image_url: string
          position: number
          post_id: string
        }
        Insert: {
          alt?: string
          created_at?: string
          id?: string
          image_url: string
          position: number
          post_id: string
        }
        Update: {
          alt?: string
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "published_post_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reviews: {
        Row: {
          author_name: string
          comment: string
          created_at: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          author_name: string
          comment: string
          created_at?: string
          id?: string
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          author_name?: string
          comment?: string
          created_at?: string
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          post_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "published_post_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      post_translations: {
        Row: {
          body: string
          created_at: string
          description: string
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          description?: string
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          description?: string
          locale?: Database["public"]["Enums"]["app_locale"]
          post_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "published_post_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          price_vnd: number | null
          product_status: Database["public"]["Enums"]["product_status"]
          published_at: string | null
          scientific_name: string | null
          scientific_name_short: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["post_status"]
          stock: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          price_vnd?: number | null
          product_status?: Database["public"]["Enums"]["product_status"]
          published_at?: string | null
          scientific_name?: string | null
          scientific_name_short?: never
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["post_status"]
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          price_vnd?: number | null
          product_status?: Database["public"]["Enums"]["product_status"]
          published_at?: string | null
          scientific_name?: string | null
          scientific_name_short?: never
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["post_status"]
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_index_queue: {
        Row: {
          attempts: number
          last_error: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          locked_until: string | null
          post_id: string
          requested_at: string
        }
        Insert: {
          attempts?: number
          last_error?: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          locked_until?: string | null
          post_id: string
          requested_at?: string
        }
        Update: {
          attempts?: number
          last_error?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          locked_until?: string | null
          post_id?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_index_queue_post_id_locale_fkey"
            columns: ["post_id", "locale"]
            isOneToOne: false
            referencedRelation: "post_translations"
            referencedColumns: ["post_id", "locale"]
          },
        ]
      }
    }
    Views: {
      published_post_cards: {
        Row: {
          category_name: string | null
          cover_image_url: string | null
          description: string | null
          id: string | null
          locale: Database["public"]["Enums"]["app_locale"] | null
          published_at: string | null
          scientific_name_short: string | null
          slug: string | null
          sort_order: number | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_rag_index_jobs: {
        Args: { p_limit?: number }
        Returns: {
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          requested_at: string
        }[]
      }
      enqueue_rag_index_jobs: {
        Args: { p_post_ids?: string[] }
        Returns: number
      }
      finish_rag_index_job: {
        Args: {
          p_error?: string
          p_locale: Database["public"]["Enums"]["app_locale"]
          p_post_id: string
          p_requested_at: string
        }
        Returns: boolean
      }
      match_document_chunks: {
        Args: {
          filter_category_ids?: string[]
          filter_locale?: Database["public"]["Enums"]["app_locale"]
          filter_post_ids?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          heading: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          post_id: string
          similarity: number
          slug: string
          title: string
        }[]
      }
      replace_document_chunks: {
        Args: {
          p_chunks: Json
          p_embedding_model: string
          p_locale: Database["public"]["Enums"]["app_locale"]
          p_post_id: string
          p_source_hash: string
          p_source_updated_at: string
        }
        Returns: boolean
      }
      place_order: {
        Args: {
          p_customer: Json
          p_lines: Json
          p_shipping_fee_vnd: number
          p_subtotal_vnd: number
          p_total_vnd: number
        }
        Returns: string
      }
    }
    Enums: {
      app_locale: "vi" | "en"
      order_status:
        | "pending"
        | "confirmed"
        | "shipping"
        | "completed"
        | "cancelled"
      payment_method: "cod" | "bank_transfer"
      post_status: "draft" | "published"
      product_status: "draft" | "active" | "archived"
      review_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_locale: ["vi", "en"],
      order_status: [
        "pending",
        "confirmed",
        "shipping",
        "completed",
        "cancelled",
      ],
      payment_method: ["cod", "bank_transfer"],
      post_status: ["draft", "published"],
      product_status: ["draft", "active", "archived"],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const
