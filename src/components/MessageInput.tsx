
import React, { useState, useRef } from "react";
import { Image, Mic, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  message: string;
  isOffline: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onAttachment: (file: File) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  isOffline,
  onMessageChange,
  onSendMessage,
  onAttachment
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentType, setAttachmentType] = useState<"image" | "voice">("image");
  
  const handleAttachmentClick = (type: "image" | "voice") => {
    setAttachmentType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "audio/*";
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttachment(files[0]);
      e.target.value = ''; // Reset the input value
    }
  };
  
  return (
    <div className="p-4 mobile-footer safe-bottom bg-background border-t">
      <div className="flex space-x-2 items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleAttachmentClick("image")} 
          className="rounded-full hover:bg-secondary/50 transition-colors"
        >
          <Image className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleAttachmentClick("voice")} 
          className="rounded-full hover:bg-secondary/50 transition-colors"
        >
          <Mic className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={onMessageChange}
          onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          className="flex-1 rounded-full bg-background border shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
          disabled={isOffline}
        />
        <Button 
          onClick={onSendMessage} 
          disabled={!message.trim() || isOffline}
          className="rounded-full aspect-square bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          size="icon"
        >
          <Send className="h-4 w-4 text-primary-foreground" />
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};

export default MessageInput;
