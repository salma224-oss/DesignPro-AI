export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            accounts: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    email: string | null;
                    id: string;
                    name: string;
                    picture_url: string | null;
                    public_data: Json;
                    updated_at: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    email?: string | null;
                    id?: string;
                    name: string;
                    picture_url?: string | null;
                    public_data?: Json;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    email?: string | null;
                    id?: string;
                    name?: string;
                    picture_url?: string | null;
                    public_data?: Json;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    role: 'designer' | 'ingenieur' | 'chef_projet' | 'admin';
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    role?: 'designer' | 'ingenieur' | 'chef_projet' | 'admin';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    role?: 'designer' | 'ingenieur' | 'chef_projet' | 'admin';
                    created_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    description: string;
                    method: string | null;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    description?: string;
                    method?: string | null;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string;
                    method?: string | null;
                    user_id?: string;
                };
            };
            project_members: {
                Row: {
                    id: string;
                    project_id: string;
                    user_email: string;
                    role: string;
                    status: string;
                    invited_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_email: string;
                    role?: string;
                    status?: string;
                    invited_by: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_email?: string;
                    role?: string;
                    status?: string;
                    invited_by?: string;
                    created_at?: string;
                };
            };
            project_states: {
                Row: {
                    project_id: string;
                    selected_generation_method: string | null;
                    selected_methodology: string | null;
                    methodology_params: Json | null;
                    generated_prompt: string | null;
                    design_results: Json | null;
                    step_file: string | null;
                    selected_design_index: number | null;
                    active_step: string | null;
                    uploaded_sketch: string | null;
                    uploaded_image: string | null;
                    user_prompt: string | null;
                    agent_q_evaluation: Json | null;
                    real_simulation: Json | null;
                    evaluation_complete: boolean | null;
                    updated_at: string;
                };
                Insert: {
                    project_id: string;
                    selected_generation_method?: string | null;
                    selected_methodology?: string | null;
                    methodology_params?: Json | null;
                    generated_prompt?: string | null;
                    design_results?: Json | null;
                    step_file?: string | null;
                    selected_design_index?: number | null;
                    active_step?: string | null;
                    uploaded_sketch?: string | null;
                    uploaded_image?: string | null;
                    user_prompt?: string | null;
                    agent_q_evaluation?: Json | null;
                    real_simulation?: Json | null;
                    evaluation_complete?: boolean | null;
                    updated_at?: string;
                };
                Update: {
                    project_id?: string;
                    selected_generation_method?: string | null;
                    selected_methodology?: string | null;
                    methodology_params?: Json | null;
                    generated_prompt?: string | null;
                    design_results?: Json | null;
                    step_file?: string | null;
                    selected_design_index?: number | null;
                    active_step?: string | null;
                    uploaded_sketch?: string | null;
                    uploaded_image?: string | null;
                    user_prompt?: string | null;
                    agent_q_evaluation?: Json | null;
                    real_simulation?: Json | null;
                    evaluation_complete?: boolean | null;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
};

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R;
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R;
        }
    ? R
    : never
    : never;
