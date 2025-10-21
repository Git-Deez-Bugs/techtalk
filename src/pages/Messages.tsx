import { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@supabase/supabase-js";
import Message from "../components/Message";
import MessageInput from "../components/MessageInput";
import ConversationList from "../components/ConversationsList";
import Header from "../components/Header";
import { useAutoScroll } from "../hooks/useAutoScroll";
import NoProfile from "../assets/no-profile.png";
import type { UserType, MessageType, ConversationType } from "../types";
import "./Messages.css";

function Messages() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [otherUsers, setOtherUsers] = useState<UserType[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const messagesRef = useAutoScroll([messages]);

  const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log("Error getting user: ", error.message);
      return;
    }
    if (data?.user) setUser(data.user);
  };

  const setOnlineStatus = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_online: true })
      .eq("profile_id", user.id);

    if (error) {
      console.error("Error setting online status:", error);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      setOnlineStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedUser || !user) return;

    const checkConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${selectedUser.profile_id}),and(user1_id.eq.${selectedUser.profile_id},user2_id.eq.${user.id})`
        )
        .limit(1);

      if (error) {
        console.error("Error checking conversation:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("Found existing conversation:", data[0]); // Debug log
        setConversation(data[0]);
        return;
      }

      // Create new conversation
      const { data: inserted, error: insertError } = await supabase
        .from("conversations")
        .insert({
          user1_id: user.id,
          user2_id: selectedUser.profile_id,
        })
        .select("*") // Select all columns
        .single();

      if (insertError) {
        console.error("Error creating conversation:", insertError);
        return;
      }

      console.log("Created new conversation:", inserted); // Debug log
      setConversation(inserted);
    };

    checkConversation();
  }, [selectedUser, user]);

  // fetch messages + subscribe for the active conversation
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    let mounted = true;

    const fetchMessages = async () => {
      const convId = conversation?.conversation_id ?? null;
      if (!convId) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      if (mounted) setMessages(data ?? []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`realtime-messages-${conversation.conversation_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.conversation_id}`,
        },
        (payload) => {
          console.log("New message received:", payload.new);
          const newMessage = payload.new as MessageType; // Cast here
          setMessages((prev) => {
            // avoid duplicates if the message is already present
            if (prev.some((m) => m.message_id === newMessage.message_id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    if (!selectedUser) return;

    // find the latest selectedUser object in otherUsers
    const updatedUser = otherUsers.find(
      (u) => u.profile_id === selectedUser.profile_id
    );
    if (updatedUser) setSelectedUser(updatedUser);
  }, [otherUsers]); // whenever otherUsers updates, sync selectedUser

  return (
    <div className="messages-page">
      {isMenuOpen && (
        <div className="overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}
      <div className="header-bg">
        <Header
          user={user}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      </div>
      <div className="messages-content">
        <div>
          <ConversationList
            user={user}
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
            otherUsers={otherUsers}
            setOtherUsers={setOtherUsers}
          />
        </div>

        <div className="chat-area">
          <div className="chat-header">
            {selectedUser ? (
              <img src={selectedUser?.profile_picture ?? NoProfile} />
            ) : null}
            <div className="chat-header-info">
              {selectedUser ? selectedUser.display_name : ""}
              <span>
                {selectedUser
                  ? selectedUser.is_online === true
                    ? "Online"
                    : `Online ${formatDistanceToNow(selectedUser.last_seen, {
                        addSuffix: true,
                      })}`
                  : ""}
              </span>
            </div>
          </div>

          <div className="messages-container" ref={messagesRef}>
            {messages.map((message) => (
              <Message key={message.message_id} message={message} user={user} />
            ))}
          </div>

          <div className="message-input">
            <MessageInput
              user={user}
              setUser={setUser}
              conversation={conversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
