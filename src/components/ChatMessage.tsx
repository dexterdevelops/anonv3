
import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

import { Timestamp } from "firebase/firestore"; // Import Timestamp

interface ChatMessageProps {
  content: string;
  sender: "me" | "them" | "system"; // Allow "system"
  timestamp: Timestamp; // Change type to Timestamp
  status?: "sent" | "delivered" | "read";
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  timestamp,
  status = "read" // Default status remains "read"
}) => {
  const isSent = sender === "me";
  
  // Format the timestamp safely
  const formattedTimestamp = 
    timestamp && typeof timestamp.toDate === 'function' 
      ? format(timestamp.toDate(), "p") 
      : ""; // Use 'p' for localized time format e.g., 12:00 PM, check if toDate exists

  const getStatusIcon = () => {
    if (!isSent) return null;
    
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={cn("flex mb-4", isSent ? "justify-end" : "justify-start")}>
      <div className="flex flex-col space-y-1 max-w-[85%]">
        <div 
          className={cn(
            "px-4 py-3 rounded-2xl text-sm",
            "animate-fade-in shadow-sm",
            isSent 
              ? "bg-primary text-primary-foreground rounded-br-none" 
              : "bg-muted text-muted-foreground rounded-bl-none"
          )}
        >
          {content}
        </div>
        <div 
          className={cn(
            "flex items-center text-xs gap-1 mt-1", 
            isSent ? "justify-end" : "justify-start"
          )}
        >
          <span className={cn(
            isSent ? "text-primary/80" : "text-muted-foreground"
          )}>{formattedTimestamp}</span> {/* Display formatted timestamp */}
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
