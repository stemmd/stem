// Shared types for stem detail page components

export interface Stem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  is_public: number;
  is_branch: number;
  visibility: string;
  contribution_mode: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BranchMember {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface StemCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface Node {
  id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  emoji: string | null;
  position: number;
  stem_side: number;
  status: string;
  created_by: string;
}

export interface ArtifactNode {
  artifact_id: string;
  node_id: string;
  position: number;
}

export interface Artifact {
  id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  note: string | null;
  quote: string | null;
  source_type: string;
  embed_url: string | null;
  body: string | null;
  file_key: string | null;
  file_mime: string | null;
  file_size: number | null;
  stem_position: number | null;
  stem_side: number;
  created_at: string;
  contributor_username: string;
  added_by: string;
}
