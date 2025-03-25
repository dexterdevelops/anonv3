import React from "react";
import { Mic, MessageSquare, Plus } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore"; // Import Timestamp

interface Attachment {
  type: "image" | "voice";
  url: string;
}

interface Message {
  id: string;
  content: string;
  sender: "me" | "them" | "system";
  timestamp: Timestamp; 
  attachment?: Attachment;
  // Add fields for structured system messages
  type?: string; 
  requestSenderId?: string;
  requestReceiverId?: string;
  senderNickname?: string;
  endedBy?: string; // Add field for chatEnded message
}

interface ChatMessageListProps {
  currentUserId?: string; // Add current user ID prop
  activeChat: string | null;
  messages: Message[];
  isTyping: boolean;
  onNewChat: () => void;
  viewAttachment: (attachment: Attachment) => void;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  activeChat,
  messages,
  isTyping,
  onNewChat,
  viewAttachment,
  currentUserId // Destructure the new prop
}) => {
  
  // Helper function to render system messages
  const renderSystemMessage = (msg: Message) => {
    // Handle specific structured system message types first
    if (msg.type === 'friendRequestSent') {
      if (msg.requestSenderId === currentUserId) {
        return "You sent a friend request.";
      } else if (msg.requestReceiverId === currentUserId) {
         // Use the stored nickname, default to 'Someone' if missing
        return `${msg.senderNickname || 'Someone'} sent you a friend request.`;
      } else {
        // Fallback specifically for friendRequestSent type if IDs don't match (shouldn't happen)
        return "Friend request sent.";
      }
    } else if (msg.type === 'friendRequestAccepted') {
      // Check who accepted based on the receiver ID in the message
      if (msg.requestReceiverId === currentUserId) {
        return "You accepted the friend request. You are now friends!";
      } else {
        // Use senderNickname if available (the original sender of the request)
        return `${msg.senderNickname || 'The user'} accepted your friend request. You are now friends!`;
      }
    } else if (msg.type === 'chatEnded') {
       if (msg.endedBy === currentUserId) {
         return "You ended the chat.";
       } else {
         // We don't have the partner's nickname readily available here, so keep it generic
         return "The other user ended the chat."; 
       }
    }

    // Fallback for older/simple system messages that just use the content field
    return msg.content || "System event"; // Use content if available, otherwise generic fallback
  };

  if (!activeChat) {
    return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-background">
      <div className="bg-background border rounded-xl p-8 max-w-md w-full shadow-sm">
        <div className="h-12 w-12 text-primary mx-auto mb-4">
          <MessageSquare className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Welcome to Anonymous Chat</h3>
        <p className="text-muted-foreground mb-6">
          Start a new conversation or select an existing chat to begin messaging
        </p>
        <Button onClick={onNewChat} className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
    </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 no-scrollbar bg-background">
      {messages.map((msg) => {
        if (msg.sender === "system") {
          return (
            <div key={msg.id} className="text-center text-muted-foreground my-2 text-xs">
              {renderSystemMessage(msg)} {/* Use helper function */}
            </div>
          );
        } else {
          return (
            <div key={msg.id}>
            <ChatMessage
              content={msg.content}
              sender={msg.sender}
              timestamp={msg.timestamp}
            />
            {msg.attachment && (
              <div 
                className={`mt-1 ${msg.sender === "me" ? "ml-auto" : "mr-auto"} max-w-[240px] cursor-pointer`}
                onClick={() => viewAttachment(msg.attachment!)}
              >
                {msg.attachment.type === "image" ? (
                  <div className="rounded-xl overflow-hidden border shadow-sm">
                    <img 
                      src={msg.attachment.url} 
                      alt="Attachment" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-secondary rounded-lg flex items-center gap-2 px-4 py-3 text-sm">
                    <Mic className="h-4 w-4" />
                    <span>Voice Message</span>
                  </div>
                )}
              </div>
            )}
            </div>
          );
        }
      })}
      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default ChatMessageList;
