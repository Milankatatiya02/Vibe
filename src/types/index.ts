export interface User {
  id: string;
  email: string;
  username: string;
  anonymous_name?: string;
  avatar_color?: string;
  interests?: string[];
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
  bio?: string;
  is_public?: boolean;
  banner_url?: string;
  social_links?: Record<string, string>;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  tags?: string[];
  community_id?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  community?: Community;
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface ChatSession {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
  user1?: User;
  user2?: User;
  last_message?: Message;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  sent_at: string;
  sender?: User;
}

export interface CallLog {
  id: string;
  session_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'initiated' | 'accepted' | 'rejected' | 'ended' | 'missed';
  duration_seconds: number;
  started_at: string;
  ended_at?: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
  tags?: string[];
  creator?: User;
  is_member?: boolean;
  user_role?: 'admin' | 'moderator' | 'member';
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: User;
}

export interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend?: User;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}
