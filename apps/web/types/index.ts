export type UserRole = 'owner' | 'editor' | 'viewer';
export type ProjectStatus = 'draft' | 'in_progress' | 'validation' | 'completed' | 'archived';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// Interface unifiée pour methodology_params
export interface MethodologyParams {
  // TRIZ
  improving_parameter?: string;
  worsening_parameter?: string;
  principles?: string[];
  
  // DFX
  criteria?: string[];
  constraints?: string;
  priority?: string;
  
  // Design Thinking
  user_persona?: string;
  pain_points?: string;
  user_journey?: string;
  
  // Value Engineering
  main_functions?: string;
  cost_target?: string;
  value_drivers?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  domain?: string;
  owner_id: string;
  methodology?: string;
  methodology_params?: MethodologyParams; // ✅ Type unifié
  status: ProjectStatus;
  progress?: number;
  collaborators_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id?: string;
  user_email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'rejected';
  invited_by: string;
  created_at: string;
  user?: User;
}

export interface ProjectWithMembers extends Project {
  members: ProjectMember[];
  user_role: UserRole;
  can_edit: boolean;
  can_delete: boolean;
}

export interface IdeationSession {
  id: string;
  project_id: string;
  generated_prompt: string;
  design_results: any;
  step_file_url?: string;
  created_at: string;
}