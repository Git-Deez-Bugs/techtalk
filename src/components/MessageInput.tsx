import { useState } from "react"
import supabase from "../config/supabaseClient";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./MessageInput.css";

function MessageInput({ user, conversation }: any) {
  const [input, setInput] = useState("");
  
  // Don't render if no conversation selected
  if (!conversation) {
    return null;
  }
  
  const saveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't send empty messages
    if (!input.trim()) return;
    
    console.log("Sending message to conversation:", conversation.conversation_id);
    
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.conversation_id,
        content: input.trim(),
        sender_id: user.id,
      });
    
    if (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + error.message);
      return;
    }
    
    // Clear input after successful send
    setInput("");
  }
  
  return (
    <form onSubmit={saveMessage} style={{ display: 'flex', gap: '8px', padding: '16px' }}>
      <input 
        type="text" 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        className="message-inputfield"
      />
      <button 
        type="submit"
        disabled={!input.trim()}
        className={`message-input-button ${input.trim() ? 'enabled' : 'disabled'}`}
      >
        <i className="bi bi-send"></i>
      </button>
    </form>
  )
}

export default MessageInput;