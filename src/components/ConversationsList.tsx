import { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import Conversation from "./Conversation";
import type { UserType } from "../types";
import type { User } from "@supabase/supabase-js";
import "./ConversationsList.css";

interface ConversationsListProps {
  user: User | null;
  setSelectedUser: (user: UserType | null) => void;
  otherUsers: UserType[];
  setOtherUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  selectedUser: UserType | null;
}

function ConversationList({
  user,
  setSelectedUser,
  otherUsers,
  setOtherUsers,
  selectedUser,
}: ConversationsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getOtherUsers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("profile_id", user?.id);
    if (error) {
      console.log("Cannot fetch profiles for conversations: ", error.message);
      return;
    }
    setOtherUsers(data ?? []);
  };

  useEffect(() => {
    if (!user) {
      setOtherUsers([]);
      return;
    }
    getOtherUsers();

    const channel = supabase
      .channel(`realtime-profiles`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          // ignore current user
          if (payload.new?.profile_id === user.id) return;
          setOtherUsers((prev) => {
            const newUser = payload.new as UserType;
            // add new at top, avoid duplicates
            if (prev.some((u) => u.profile_id === newUser.profile_id))
              return prev;
            return [newUser, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updatedUser = payload.new as UserType;
          setOtherUsers((prev) =>
            prev.map((u) =>
              u.profile_id === updatedUser.profile_id ? updatedUser : u
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles" },
        (payload) => {
          setOtherUsers((prev) =>
            prev.filter((u) => u.profile_id !== payload.old.profile_id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Filter users based on search term
  const filteredUsers = otherUsers.filter((otherUser) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();
    const displayName = otherUser.display_name?.toLowerCase() || "";

    return displayName.includes(search);
  });

  return (
    <div className="conversations-list sidebar">
      <div className="searchbar-container">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="conversation-searchbar"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="conversation-items">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((otherUser) => (
            <Conversation
              key={otherUser.profile_id}
              otherUser={otherUser}
              setSelectedUser={setSelectedUser}
              selectedUser={selectedUser}
            />
          ))
        ) : (
          <div className="no-results">No users found</div>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
