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
      bookings: {
        Row: {
          confirmation_email: string | null
          confirmed_at: string
          id: string
          summary: string
          trip_id: string
          user_id: string
        }
        Insert: {
          confirmation_email?: string | null
          confirmed_at?: string
          id?: string
          summary: string
          trip_id: string
          user_id: string
        }
        Update: {
          confirmation_email?: string | null
          confirmed_at?: string
          id?: string
          summary?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          address: string | null
          cost: number | null
          cover_photo_url: string | null
          created_at: string
          day_number: number
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          open_hours: Json | null
          order_index: number
          place_type: string | null
          rating: number | null
          start_time: string | null
          status_tag: string | null
          time_slot: string
          title: string
          trip_id: string
          user_id: string
          weather: string | null
        }
        Insert: {
          address?: string | null
          cost?: number | null
          cover_photo_url?: string | null
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          open_hours?: Json | null
          order_index?: number
          place_type?: string | null
          rating?: number | null
          start_time?: string | null
          status_tag?: string | null
          time_slot?: string
          title: string
          trip_id: string
          user_id: string
          weather?: string | null
        }
        Update: {
          address?: string | null
          cost?: number | null
          cover_photo_url?: string | null
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          open_hours?: Json | null
          order_index?: number
          place_type?: string | null
          rating?: number | null
          start_time?: string | null
          status_tag?: string | null
          time_slot?: string
          title?: string
          trip_id?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: number
          cover_photo_url: string | null
          created_at: string
          destination: string
          destination_lat: number | null
          destination_lng: number | null
          end_date: string
          id: string
          spent: number
          start_date: string
          updated_at: string
          user_id: string
          vibe: string
        }
        Insert: {
          budget?: number
          cover_photo_url?: string | null
          created_at?: string
          destination: string
          destination_lat?: number | null
          destination_lng?: number | null
          end_date: string
          id?: string
          spent?: number
          start_date: string
          updated_at?: string
          user_id: string
          vibe?: string
        }
        Update: {
          budget?: number
          cover_photo_url?: string | null
          created_at?: string
          destination?: string
          destination_lat?: number | null
          destination_lng?: number | null
          end_date?: string
          id?: string
          spent?: number
          start_date?: string
          updated_at?: string
          user_id?: string
          vibe?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          email_notifications: boolean
          notification_email: string | null
          updated_at: string
          user_id: string
          whatsapp_notifications: boolean
          whatsapp_number: string | null
        }
        Insert: {
          email_notifications?: boolean
          notification_email?: string | null
          updated_at?: string
          user_id: string
          whatsapp_notifications?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          email_notifications?: boolean
          notification_email?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_notifications?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
