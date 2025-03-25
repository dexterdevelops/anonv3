import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

// Re-using the Chat interface from Layout.tsx
interface ChatItem {
  id: string;
  name: string; // Friend's name or chat name
  lastMessage?: string;
  time?: string;
  online?: boolean;
  photoURL?: string;
}

interface FriendListProps {
  savedChats: ChatItem[]; // Accept saved chats (non-active)
  activeChatId: string | null; // Keep for potential future use
  onSelectChat: (chatId: string) => void;
}

// Ensure the component definition is correct
const FriendList: React.FC<FriendListProps> = ({
  savedChats,
  activeChatId,
  onSelectChat,
}) => {
  // Use only savedChats
  const displayItems = savedChats;

  // Placeholder function to get fallback initials
  const getInitials = (name: string): string => { // Added return type for clarity
    return name?.charAt(0).toUpperCase() || 'U';
  }; // Added semicolon for consistency

  // Ensure return statement is correctly placed and formatted
  return (
    <div className="p-2 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3 px-2">Saved Chats</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {displayItems.length > 0
            ? displayItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full h-auto justify-start p-2 text-left rounded-md",
                    item.id === activeChatId && "bg-gray-200 dark:bg-gray-700"
                  )}
                  onClick={() => onSelectChat(item.id)}
                >
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src={item.photoURL} alt={item.name} />
                    <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.lastMessage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.lastMessage}
                      </p>
                    )}
                  </div>
                </Button>
              ))
            : <p className="text-sm text-gray-500 dark:text-gray-400 px-2">No saved chats.</p>
          }
        </div>
      </ScrollArea>
    </div>
  );
}; // Ensure closing brace for component

export default FriendList;
