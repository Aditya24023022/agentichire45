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
      generations: {
        Row: {
          created_at: string | null
          id: string
          input_data: Json | null
          job_id: string | null
          output_content: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          job_id?: string | null
          output_content?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          job_id?: string | null
          output_content?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "saved_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          feedback: string | null
          id: string
          job_description: string | null
          questions: Json | null
          responses: Json | null
          resume_content: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          job_description?: string | null
          questions?: Json | null
          responses?: Json | null
          resume_content?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          job_description?: string | null
          questions?: Json | null
          responses?: Json | null
          resume_content?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          career_goals: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: string | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          profile_completed: boolean | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          career_goals?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          profile_completed?: boolean | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          career_goals?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          profile_completed?: boolean | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          parsed_content: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          parsed_content?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          parsed_content?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string
          job_description: string | null
          job_title: string | null
          job_url: string | null
          scraped_data: Json | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          job_description?: string | null
          job_title?: string | null
          job_url?: string | null
          scraped_data?: Json | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string
          job_description?: string | null
          job_title?: string | null
          job_url?: string | null
          scraped_data?: Json | null
          user_id?: string
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
