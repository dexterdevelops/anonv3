import React, { useState, useEffect } from "react";
import { Menu, MessageSquare, UserPlus, X, Hourglass, UserCheck } from "lucide-react"; // Added Hourglass, UserCheck
import { Button } from "@/components/ui/button";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming you have a firebase config file
import { FriendRequestStatus } from "@/hooks/useFriendRequests"; // Import the status type

interface ChatHeaderProps {
  activeChat: string | null;
  chatName: string | undefined;
  isOnline: boolean | undefined;
  isOffline: boolean;
  onMobileMenuOpen?: () => void; // Made optional
  onEndChat: () => void;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void; // Added accept handler
  friendRequestStatus: FriendRequestStatus; // Use the specific status type
  nickname?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChat,
  chatName,
  isOnline,
  isOffline,
  // onMobileMenuOpen, // Removed from destructuring
  onEndChat,
  onSendFriendRequest,
  onAcceptFriendRequest, // Destructure accept handler
  friendRequestStatus, // Destructure status
  nickname
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [partnerNickname, setPartnerNickname] = useState("Anonymous User");

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Anonymous Chat',
        text: 'Join me for an anonymous chat!',
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    }
  };

  useEffect(() => {
    const fetchPartnerNickname = async () => {
      if (!activeChat) return;
      
      const partnerId = activeChat; // Assuming activeChat is the partner's ID
      const userDoc = await getDoc(doc(db, "users", partnerId));
      const userData = userDoc.data();
      setPartnerNickname(userData?.nickname || "Anonymous User");
    };

    fetchPartnerNickname();
  }, [activeChat]);

  // Helper function to render the correct friend request button
  const renderFriendRequestButton = () => {
    switch (friendRequestStatus) {
      case 'none':
        return (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-secondary"
            onClick={onSendFriendRequest}
            aria-label="Send Friend Request"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        );
      case 'sent':
        return (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full opacity-50 cursor-not-allowed"
            disabled
            aria-label="Friend Request Pending"
          >
            <Hourglass className="h-5 w-5" />
          </Button>
        );
      case 'received':
        return (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-green-500 hover:bg-green-100 hover:text-green-600"
            onClick={onAcceptFriendRequest}
            aria-label="Accept Friend Request"
          >
            <UserCheck className="h-5 w-5" />
          </Button>
        );
      case 'accepted':
        // Button disappears when accepted
        return null; 
      default:
        return null; // Should not happen
    }
  };

  return (
    <div className="p-4 border-b mobile-header flex items-center">
      {/* Removed mobile menu button */}
      {/* <Button variant="ghost" size="icon" className="md:hidden mr-2 rounded-full" onClick={onMobileMenuOpen}>
        <Menu className="h-5 w-5" />
      </Button> */}
      
      <div className="flex-1 flex items-center">
        {/* Added some margin to compensate for removed button */}
        <div className={`avatar-container h-10 w-10 ${isOnline ? "avatar-online" : ""} md:ml-2`}> 
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="ml-3 min-w-0">
          <div className="font-medium truncate">
            {activeChat ? partnerNickname : "Start Chatting"}
          </div>
          <div className="text-xs text-muted-foreground">
            {isOffline 
              ? "Reconnecting..." 
              : (activeChat && isOnline 
                ? "Online now" 
                : "Offline")}
          </div>
        </div>
      </div>
      
      {/* Direct Action Buttons */}
      {activeChat ? (
        <div className="flex items-center space-x-2">
          {/* Render dynamic friend request button */}
          {renderFriendRequestButton()} 
          {/* End Chat button remains */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:bg-secondary hover:text-destructive"
            onClick={onEndChat}
            aria-label="End Chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        // Share button when no active chat (optional, kept from original)
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleShare} 
          className="rounded-full hover:bg-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </Button>
      )}
    </div>
  );
};

export default ChatHeader;
