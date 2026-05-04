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
      active_battles: {
        Row: {
          created_at: string
          game_state: Json | null
          id: string
          player1_banner_id: string
          player1_id: string
          player1_level: number
          player1_name: string
          player1_ready: boolean
          player2_banner_id: string
          player2_id: string
          player2_level: number
          player2_name: string
          player2_ready: boolean
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          game_state?: Json | null
          id?: string
          player1_banner_id?: string
          player1_id: string
          player1_level?: number
          player1_name: string
          player1_ready?: boolean
          player2_banner_id?: string
          player2_id: string
          player2_level?: number
          player2_name: string
          player2_ready?: boolean
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          game_state?: Json | null
          id?: string
          player1_banner_id?: string
          player1_id?: string
          player1_level?: number
          player1_name?: string
          player1_ready?: boolean
          player2_banner_id?: string
          player2_id?: string
          player2_level?: number
          player2_name?: string
          player2_ready?: boolean
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      battle_requests: {
        Row: {
          created_at: string
          expires_at: string
          from_player_name: string
          from_user_id: string
          id: string
          status: string
          to_player_name: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          from_player_name: string
          from_user_id: string
          id?: string
          status?: string
          to_player_name: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_player_name?: string
          from_user_id?: string
          id?: string
          status?: string
          to_player_name?: string
          to_user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          player_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          player_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          player_name?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          player_name: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          player_name: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          player_name?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_messages: {
        Row: {
          clan_id: string
          created_at: string
          id: string
          message: string
          player_name: string
          user_id: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          id?: string
          message: string
          player_name: string
          user_id: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          id?: string
          message?: string
          player_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          badge_emoji: string
          created_at: string
          description: string | null
          id: string
          is_open: boolean
          leader_id: string
          member_count: number
          min_trophies: number
          name: string
        }
        Insert: {
          badge_emoji?: string
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          leader_id: string
          member_count?: number
          min_trophies?: number
          name: string
        }
        Update: {
          badge_emoji?: string
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          leader_id?: string
          member_count?: number
          min_trophies?: number
          name?: string
        }
        Relationships: []
      }
      online_players: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          is_online: boolean
          last_seen: string
          level: number
          player_name: string
          trophies: number
          user_id: string
        }
        Insert: {
          banner_id?: string
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          level?: number
          player_name: string
          trophies?: number
          user_id: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          level?: number
          player_name?: string
          trophies?: number
          user_id?: string
        }
        Relationships: []
      }
      online_players_public: {
        Row: {
          banner_id: string | null
          created_at: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          level: number | null
          player_name: string | null
          trophies: number | null
        }
        Insert: {
          banner_id?: string | null
          created_at?: string | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          player_name?: string | null
          trophies?: number | null
        }
        Update: {
          banner_id?: string | null
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          player_name?: string | null
          trophies?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_deck_id: string
          banner_id: string
          card_copies: Json
          chests_available: number
          claimed_trophy_rewards: number[]
          created_at: string
          current_deck: string[]
          deck_slots: Json
          evolution_shards: number
          gold: number
          id: string
          last_free_chest_date: string | null
          level: number
          losses: number
          owned_banner_ids: string[]
          owned_card_ids: string[]
          player_name: string
          selected_tower_troop_id: string
          tower_copies: Json
          trophies: number
          unlocked_evolutions: string[]
          unlocked_tower_troop_ids: string[]
          updated_at: string
          wild_card_counts: Json
          wins: number
          xp: number
        }
        Insert: {
          active_deck_id?: string
          banner_id?: string
          card_copies?: Json
          chests_available?: number
          claimed_trophy_rewards?: number[]
          created_at?: string
          current_deck?: string[]
          deck_slots?: Json
          evolution_shards?: number
          gold?: number
          id: string
          last_free_chest_date?: string | null
          level?: number
          losses?: number
          owned_banner_ids?: string[]
          owned_card_ids?: string[]
          player_name?: string
          selected_tower_troop_id?: string
          tower_copies?: Json
          trophies?: number
          unlocked_evolutions?: string[]
          unlocked_tower_troop_ids?: string[]
          updated_at?: string
          wild_card_counts?: Json
          wins?: number
          xp?: number
        }
        Update: {
          active_deck_id?: string
          banner_id?: string
          card_copies?: Json
          chests_available?: number
          claimed_trophy_rewards?: number[]
          created_at?: string
          current_deck?: string[]
          deck_slots?: Json
          evolution_shards?: number
          gold?: number
          id?: string
          last_free_chest_date?: string | null
          level?: number
          losses?: number
          owned_banner_ids?: string[]
          owned_card_ids?: string[]
          player_name?: string
          selected_tower_troop_id?: string
          tower_copies?: Json
          trophies?: number
          unlocked_evolutions?: string[]
          unlocked_tower_troop_ids?: string[]
          updated_at?: string
          wild_card_counts?: Json
          wins?: number
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_requests: { Args: never; Returns: undefined }
      get_user_clan_role: {
        Args: { check_clan_id: string; check_user_id: string }
        Returns: string
      }
      get_user_id_for_player: {
        Args: { player_record_id: string }
        Returns: string
      }
      is_user_in_clan: {
        Args: { check_clan_id: string; check_user_id: string }
        Returns: boolean
      }
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
