export interface UserType {
  profile_id: string;
  display_name: string;
  created_at: string;
  is_online: boolean;
  last_seen: string;
  profile_picture: string | null;
}

export interface MessageType {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ConversationType {
  conversation_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}