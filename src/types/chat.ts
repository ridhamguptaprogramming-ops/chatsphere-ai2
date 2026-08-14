export type ConversationType = 'direct' | 'group';

export type MemberRole = 'owner' | 'admin' | 'member';

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  status_text?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar_url?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Dynamic fields populated for client view
  last_message?: Message;
  unread_count?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  other_user?: Profile; // For direct chats
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned?: boolean;
  profile?: Profile;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string; // Emoji char e.g. ❤️, 😂, 👍
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  reply_to_message_id?: string;
  reply_to_message?: Message;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  deleted_at?: string;
  sender?: Profile;
  reactions?: MessageReaction[];
  // Transient read status
  is_read?: boolean;
}

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  updated_at: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
  user?: Profile;
}

export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  read_receipts_enabled: boolean;
  last_seen_visibility: 'everyone' | 'contacts' | 'nobody';
  profile_visibility: 'everyone' | 'contacts' | 'nobody';
  created_at: string;
  updated_at: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
