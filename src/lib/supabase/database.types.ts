export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
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
      background_jobs: {
        Row: {
          attempt: number;
          available_at: string;
          completed_at: string | null;
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          id: string;
          idempotency_key: string;
          kind: string;
          max_attempts: number;
          payload: Json;
          started_at: string | null;
          status: Database["public"]["Enums"]["background_job_status"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          attempt?: number;
          available_at?: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          idempotency_key: string;
          kind: string;
          max_attempts?: number;
          payload: Json;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["background_job_status"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          attempt?: number;
          available_at?: string;
          completed_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          idempotency_key?: string;
          kind?: string;
          max_attempts?: number;
          payload?: Json;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["background_job_status"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "background_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_proof_points: {
        Row: {
          brand_id: string;
          created_at: string;
          detail: string;
          id: string;
          label: string;
          source_note: string | null;
          tenant_id: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          detail: string;
          id?: string;
          label: string;
          source_note?: string | null;
          tenant_id: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          detail?: string;
          id?: string;
          label?: string;
          source_note?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_proof_points_tenant_id_brand_id_fkey";
            columns: ["tenant_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "brand_proof_points_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_restrictions: {
        Row: {
          brand_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          restriction_type: string;
          tenant_id: string;
          value: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          restriction_type: string;
          tenant_id: string;
          value: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          restriction_type?: string;
          tenant_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_restrictions_tenant_id_brand_id_fkey";
            columns: ["tenant_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "brand_restrictions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          brand_voice: Json;
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          status: string;
          tenant_id: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          brand_voice?: Json;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          brand_voice?: Json;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "brands_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_assets: {
        Row: {
          content_sha256: string | null;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          error_code: string | null;
          error_message: string | null;
          height: number | null;
          id: string;
          media_type: string;
          mime_type: string | null;
          source_id: string | null;
          status: Database["public"]["Enums"]["creative_status"];
          tenant_id: string;
          title: string | null;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          height?: number | null;
          id?: string;
          media_type?: string;
          mime_type?: string | null;
          source_id?: string | null;
          status?: Database["public"]["Enums"]["creative_status"];
          tenant_id: string;
          title?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          content_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          height?: number | null;
          id?: string;
          media_type?: string;
          mime_type?: string | null;
          source_id?: string | null;
          status?: Database["public"]["Enums"]["creative_status"];
          tenant_id?: string;
          title?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "creative_assets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_assets_tenant_id_source_id_fkey";
            columns: ["tenant_id", "source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      deconstructions: {
        Row: {
          created_at: string;
          creative_asset_id: string;
          generation_run_id: string;
          id: string;
          payload: Json;
          schema_version: string;
          summary: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          creative_asset_id: string;
          generation_run_id: string;
          id?: string;
          payload: Json;
          schema_version: string;
          summary?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          creative_asset_id?: string;
          generation_run_id?: string;
          id?: string;
          payload?: Json;
          schema_version?: string;
          summary?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deconstructions_tenant_id_creative_asset_id_fkey";
            columns: ["tenant_id", "creative_asset_id"];
            isOneToOne: true;
            referencedRelation: "creative_assets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "deconstructions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deconstructions_tenant_id_generation_run_id_fkey";
            columns: ["tenant_id", "generation_run_id"];
            isOneToOne: false;
            referencedRelation: "generation_runs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      generation_runs: {
        Row: {
          attempt: number;
          completed_at: string | null;
          cost_microusd: number | null;
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          id: string;
          idempotency_key: string;
          input_fingerprint: string;
          kind: Database["public"]["Enums"]["generation_kind"];
          latency_ms: number | null;
          model: string;
          prompt_version: string | null;
          provider: string;
          request_metadata: Json;
          schema_version: string;
          status: Database["public"]["Enums"]["generation_status"];
          tenant_id: string;
          usage_metadata: Json;
        };
        Insert: {
          attempt?: number;
          completed_at?: string | null;
          cost_microusd?: number | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          idempotency_key: string;
          input_fingerprint: string;
          kind: Database["public"]["Enums"]["generation_kind"];
          latency_ms?: number | null;
          model: string;
          prompt_version?: string | null;
          provider: string;
          request_metadata?: Json;
          schema_version: string;
          status?: Database["public"]["Enums"]["generation_status"];
          tenant_id: string;
          usage_metadata?: Json;
        };
        Update: {
          attempt?: number;
          completed_at?: string | null;
          cost_microusd?: number | null;
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          idempotency_key?: string;
          input_fingerprint?: string;
          kind?: Database["public"]["Enums"]["generation_kind"];
          latency_ms?: number | null;
          model?: string;
          prompt_version?: string | null;
          provider?: string;
          request_metadata?: Json;
          schema_version?: string;
          status?: Database["public"]["Enums"]["generation_status"];
          tenant_id?: string;
          usage_metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "generation_runs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      media_artifacts: {
        Row: {
          byte_size: number | null;
          created_at: string;
          creative_asset_id: string;
          expires_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          metadata: Json;
          mime_type: string | null;
          storage_key: string;
          tenant_id: string;
        };
        Insert: {
          byte_size?: number | null;
          created_at?: string;
          creative_asset_id: string;
          expires_at?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          metadata?: Json;
          mime_type?: string | null;
          storage_key: string;
          tenant_id: string;
        };
        Update: {
          byte_size?: number | null;
          created_at?: string;
          creative_asset_id?: string;
          expires_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["artifact_kind"];
          metadata?: Json;
          mime_type?: string | null;
          storage_key?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_artifacts_tenant_id_creative_asset_id_fkey";
            columns: ["tenant_id", "creative_asset_id"];
            isOneToOne: false;
            referencedRelation: "creative_assets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "media_artifacts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      media_uploads: {
        Row: {
          created_at: string;
          creative_asset_id: string;
          declared_byte_size: number;
          declared_mime_type: string;
          expires_at: string;
          id: string;
          initiation_key: string;
          original_filename: string;
          rejection_code: string | null;
          status: Database["public"]["Enums"]["media_upload_status"];
          storage_key: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          creative_asset_id: string;
          declared_byte_size: number;
          declared_mime_type: string;
          expires_at?: string;
          id?: string;
          initiation_key: string;
          original_filename: string;
          rejection_code?: string | null;
          status?: Database["public"]["Enums"]["media_upload_status"];
          storage_key: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          creative_asset_id?: string;
          declared_byte_size?: number;
          declared_mime_type?: string;
          expires_at?: string;
          id?: string;
          initiation_key?: string;
          original_filename?: string;
          rejection_code?: string | null;
          status?: Database["public"]["Enums"]["media_upload_status"];
          storage_key?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_uploads_tenant_id_creative_asset_id_fkey";
            columns: ["tenant_id", "creative_asset_id"];
            isOneToOne: true;
            referencedRelation: "creative_assets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "media_uploads_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      personas: {
        Row: {
          attributes: Json;
          awareness_stage: string | null;
          brand_id: string;
          created_at: string;
          description: string | null;
          desires: Json;
          id: string;
          name: string;
          objections: Json;
          pains: Json;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          attributes?: Json;
          awareness_stage?: string | null;
          brand_id: string;
          created_at?: string;
          description?: string | null;
          desires?: Json;
          id?: string;
          name: string;
          objections?: Json;
          pains?: Json;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          attributes?: Json;
          awareness_stage?: string | null;
          brand_id?: string;
          created_at?: string;
          description?: string | null;
          desires?: Json;
          id?: string;
          name?: string;
          objections?: Json;
          pains?: Json;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personas_tenant_id_brand_id_fkey";
            columns: ["tenant_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "personas_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          brand_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          offer_details: Json;
          price_description: string | null;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          offer_details?: Json;
          price_description?: string | null;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          offer_details?: Json;
          price_description?: string | null;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_brand_id_fkey";
            columns: ["tenant_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      skeleton_restricted_elements: {
        Row: {
          created_at: string;
          element_type: Database["public"]["Enums"]["restricted_element_type"];
          id: string;
          normalized_value: string;
          severity: number;
          skeleton_id: string;
          tenant_id: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          element_type: Database["public"]["Enums"]["restricted_element_type"];
          id?: string;
          normalized_value: string;
          severity: number;
          skeleton_id: string;
          tenant_id: string;
          value: string;
        };
        Update: {
          created_at?: string;
          element_type?: Database["public"]["Enums"]["restricted_element_type"];
          id?: string;
          normalized_value?: string;
          severity?: number;
          skeleton_id?: string;
          tenant_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skeleton_restricted_elements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skeleton_restricted_elements_tenant_id_skeleton_id_fkey";
            columns: ["tenant_id", "skeleton_id"];
            isOneToOne: false;
            referencedRelation: "skeletons";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      skeletons: {
        Row: {
          canonical_text: string;
          created_at: string;
          deconstruction_id: string;
          embedding_model: string | null;
          generation_run_id: string;
          id: string;
          payload: Json;
          schema_version: string;
          tenant_id: string;
        };
        Insert: {
          canonical_text: string;
          created_at?: string;
          deconstruction_id: string;
          embedding_model?: string | null;
          generation_run_id: string;
          id?: string;
          payload: Json;
          schema_version: string;
          tenant_id: string;
        };
        Update: {
          canonical_text?: string;
          created_at?: string;
          deconstruction_id?: string;
          embedding_model?: string | null;
          generation_run_id?: string;
          id?: string;
          payload?: Json;
          schema_version?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skeletons_tenant_id_deconstruction_id_fkey";
            columns: ["tenant_id", "deconstruction_id"];
            isOneToOne: true;
            referencedRelation: "deconstructions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "skeletons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skeletons_tenant_id_generation_run_id_fkey";
            columns: ["tenant_id", "generation_run_id"];
            isOneToOne: false;
            referencedRelation: "generation_runs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      sources: {
        Row: {
          created_at: string;
          id: string;
          platform_external_id: string | null;
          provenance: Json;
          source_type: Database["public"]["Enums"]["source_type"];
          source_url: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform_external_id?: string | null;
          provenance?: Json;
          source_type: Database["public"]["Enums"]["source_type"];
          source_url?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform_external_id?: string | null;
          provenance?: Json;
          source_type?: Database["public"]["Enums"]["source_type"];
          source_url?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_memberships: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["membership_role"];
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["membership_role"];
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["membership_role"];
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          brand_brain_completed_at: string | null;
          created_at: string;
          id: string;
          name: string;
          slug: string | null;
          updated_at: string;
        };
        Insert: {
          brand_brain_completed_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          slug?: string | null;
          updated_at?: string;
        };
        Update: {
          brand_brain_completed_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transcripts: {
        Row: {
          created_at: string;
          creative_asset_id: string;
          generation_run_id: string;
          id: string;
          language: string | null;
          model: string;
          provider: string;
          schema_version: string;
          segments: Json;
          tenant_id: string;
          text_content: string;
        };
        Insert: {
          created_at?: string;
          creative_asset_id: string;
          generation_run_id: string;
          id?: string;
          language?: string | null;
          model: string;
          provider: string;
          schema_version: string;
          segments?: Json;
          tenant_id: string;
          text_content: string;
        };
        Update: {
          created_at?: string;
          creative_asset_id?: string;
          generation_run_id?: string;
          id?: string;
          language?: string | null;
          model?: string;
          provider?: string;
          schema_version?: string;
          segments?: Json;
          tenant_id?: string;
          text_content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcripts_tenant_id_creative_asset_id_fkey";
            columns: ["tenant_id", "creative_asset_id"];
            isOneToOne: true;
            referencedRelation: "creative_assets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "transcripts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcripts_tenant_id_generation_run_id_fkey";
            columns: ["tenant_id", "generation_run_id"];
            isOneToOne: false;
            referencedRelation: "generation_runs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_brand_brain: { Args: { input: Json }; Returns: string };
      bootstrap_tenant: { Args: { requested_name: string }; Returns: string };
      claim_analysis_job: {
        Args: { requested_job_id: string };
        Returns: {
          attempt: number;
          creative_asset_id: string;
          tenant_id: string;
        }[];
      };
      claim_media_job: {
        Args: { requested_job_id: string };
        Returns: {
          attempt: number;
          creative_asset_id: string;
          tenant_id: string;
        }[];
      };
      complete_creative_dna_run: {
        Args: {
          creative_dna: Json;
          requested_cost_microusd: number;
          requested_job_id: string;
          requested_latency_ms: number;
          requested_run_id: string;
          requested_summary: string;
          requested_usage_metadata: Json;
        };
        Returns: string;
      };
      complete_creative_upload: {
        Args: {
          raw_retention_days: number;
          requested_asset_id: string;
          verified_byte_size: number;
          verified_mime_type: string;
          verified_sha256: string;
        };
        Returns: string;
      };
      complete_skeleton_run: {
        Args: {
          requested_cost_microusd: number;
          requested_deconstruction_id: string;
          requested_job_id: string;
          requested_latency_ms: number;
          requested_run_id: string;
          requested_usage_metadata: Json;
          restricted_elements: Json;
          skeleton_payload: Json;
        };
        Returns: string;
      };
      complete_transcription_run: {
        Args: {
          requested_cost_microusd: number;
          requested_latency_ms: number;
          requested_run_id: string;
          requested_usage_metadata: Json;
          transcript_language: string;
          transcript_segments: Json;
          transcript_text: string;
        };
        Returns: string;
      };
      fail_analysis_job: {
        Args: {
          requested_error_code: string;
          requested_error_message: string;
          requested_job_id: string;
          requested_run_id: string;
        };
        Returns: undefined;
      };
      fail_media_job: {
        Args: {
          requested_error_code: string;
          requested_error_message: string;
          requested_job_id: string;
        };
        Returns: undefined;
      };
      finish_media_job: {
        Args: {
          derived_artifacts: Json;
          media_metadata: Json;
          requested_job_id: string;
        };
        Returns: string;
      };
      initialize_creative_upload: {
        Args: {
          requested_byte_size: number;
          requested_filename: string;
          requested_initiation_key: string;
          requested_mime_type: string;
          requested_title: string;
        };
        Returns: {
          creative_asset_id: string;
          storage_key: string;
        }[];
      };
      reject_creative_upload: {
        Args: {
          requested_asset_id: string;
          requested_error_code: string;
          requested_error_message: string;
        };
        Returns: undefined;
      };
      retry_creative_processing: {
        Args: { requested_asset_id: string };
        Returns: string;
      };
      start_generation_run: {
        Args: {
          requested_asset_id: string;
          requested_idempotency_key: string;
          requested_input_fingerprint: string;
          requested_kind: Database["public"]["Enums"]["generation_kind"];
          requested_model: string;
          requested_prompt_version: string;
          requested_provider: string;
          requested_schema_version: string;
          requested_tenant_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      artifact_kind:
        | "ORIGINAL"
        | "AUDIO"
        | "THUMBNAIL"
        | "FRAME"
        | "TRANSCRIPT_FILE"
        | "NORMALIZED_VIDEO";
      background_job_status:
        "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
      creative_status:
        | "PENDING"
        | "INGESTING"
        | "TRANSCRIBING"
        | "EXTRACTING_FRAMES"
        | "ANALYZING"
        | "SKELETONIZING"
        | "READY"
        | "FAILED"
        | "CANCELLED";
      generation_kind:
        | "TRANSCRIPTION"
        | "CREATIVE_DNA"
        | "SKELETON"
        | "COMPOSITION"
        | "ORIGINALITY"
        | "EMBEDDING"
        | "OTHER";
      generation_status:
        | "QUEUED"
        | "GENERATING"
        | "EVALUATING"
        | "REGENERATING"
        | "COMPLETED"
        | "FAILED";
      media_upload_status: "INITIATED" | "VALIDATED" | "REJECTED";
      membership_role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
      restricted_element_type:
        | "PHRASE"
        | "UNIQUE_FACT"
        | "METAPHOR"
        | "SCENE"
        | "CLAIM"
        | "NAME"
        | "OTHER";
      source_type:
        | "UPLOAD"
        | "URL"
        | "YOUTUBE"
        | "META_AUTHORIZED"
        | "TIKTOK_AUTHORIZED"
        | "LICENSED_DATASET"
        | "OTHER";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
      artifact_kind: [
        "ORIGINAL",
        "AUDIO",
        "THUMBNAIL",
        "FRAME",
        "TRANSCRIPT_FILE",
        "NORMALIZED_VIDEO",
      ],
      background_job_status: [
        "QUEUED",
        "RUNNING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
      ],
      creative_status: [
        "PENDING",
        "INGESTING",
        "TRANSCRIBING",
        "EXTRACTING_FRAMES",
        "ANALYZING",
        "SKELETONIZING",
        "READY",
        "FAILED",
        "CANCELLED",
      ],
      generation_kind: [
        "TRANSCRIPTION",
        "CREATIVE_DNA",
        "SKELETON",
        "COMPOSITION",
        "ORIGINALITY",
        "EMBEDDING",
        "OTHER",
      ],
      generation_status: [
        "QUEUED",
        "GENERATING",
        "EVALUATING",
        "REGENERATING",
        "COMPLETED",
        "FAILED",
      ],
      media_upload_status: ["INITIATED", "VALIDATED", "REJECTED"],
      membership_role: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      restricted_element_type: [
        "PHRASE",
        "UNIQUE_FACT",
        "METAPHOR",
        "SCENE",
        "CLAIM",
        "NAME",
        "OTHER",
      ],
      source_type: [
        "UPLOAD",
        "URL",
        "YOUTUBE",
        "META_AUTHORIZED",
        "TIKTOK_AUTHORIZED",
        "LICENSED_DATASET",
        "OTHER",
      ],
    },
  },
} as const;
