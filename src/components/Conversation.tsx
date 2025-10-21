import "./Conversation.css";
import NoProfile from "../assets/no-profile.png";

function Conversation({ otherUser, setSelectedUser, selectedUser }: any) {
  return(
    <div onClick={() => setSelectedUser(otherUser)} className={`conversation ${selectedUser === otherUser ? "active" : ""}`}>
      <div className="conversation-profile-container">
        <img src={otherUser.profile_picture ? otherUser.profile_picture : NoProfile} className="conversation-profile"/>
        {otherUser.is_online && <div></div>}
      </div>
      
      <p>{otherUser.display_name}</p>
    </div>
  )
}

export default Conversation;