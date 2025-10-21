import { format } from "date-fns";
import "./Message.css";

function Message({ message, user }: any) {

  return (
    <div className={message.sender_id === user?.id ? "your-message" : "their-message"}>
      <div className="message-text">
        {message.content}
      </div>
      <div>{format(new Date(message.created_at), 'MMM d, h:mm a')}</div>
    </div>
  );
}

export default Message;
