import { useState, useEffect } from "react";
// Removed ArrowLeft import as mobile menu button is gone
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// Removed UserDashboard import
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHeader from "@/components/ChatHeader";
import ChatMessageList from "@/components/ChatMessageList";
import MessageInput from "@/components/MessageInput";
import NetworkStatus from "@/components/NetworkStatus";
// Removed useFirebaseAuth and useFirebaseChat imports
import { generateFunkyName } from "@/utils/nameGenerator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useFriendRequests } from "@/hooks/useFriendRequests"; // Import friend request hook
import { useLayoutContext, ChatItem, Message } from '@/components/Layout'; // Import context hook and types

// Removed duplicate Chat interface definition

const Index = () => {
  // Removed isMobile and mobileMenuOpen state
  const [message, setMessage] = useState("");
  // Removed friendRequestSent state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get state and functions from LayoutContext
  const {
    user,
    chats, // Already mapped in LayoutContext
    messages,
    activeChat,
    // setActiveChat is used in Layout/Sidebar, not directly needed here unless for specific actions
    sendMessage: contextSendMessage, // Renamed
    startNewChat: contextStartNewChat, // Renamed
    endChat: contextEndChat, // Renamed
    sendFriendRequest: contextSendFriendRequest, // Renamed
    // Get active chat partner ID
    activeChatPartnerId,
  } = useLayoutContext();

  // Use the friend request hook for the active chat
  const {
    activeChatRequestStatus,
    activeChatRequestId,
    acceptFriendRequest,
    // loading: friendRequestLoading, // Optional loading state
  } = useFriendRequests(user?.uid, activeChatPartnerId);


  // Nickname state remains local to Index for now
  const [userNickname, setUserNickname] = useState<string>(() => {
    const savedNickname = localStorage.getItem("nickname");
    return savedNickname || generateFunkyName();
  });

  // Effect to set nickname if not present
  useEffect(() => {
    if (user && (!localStorage.getItem("nickname") || !userNickname)) {
      const nickname = generateFunkyName();
      setUserNickname(nickname);
      localStorage.setItem("nickname", nickname);
    }
  }, [user, userNickname]);

  // Online status management
  const { isOnline, isOffline } = useOnlineStatus(user?.uid);

  // Removed friendRequestSent reset effect

  // Removed handleChatSelect as selection is handled in Layout/Sidebar

  const handleNewChat = async () => {
    toast({
      title: "New Chat",
      description: "Starting a new anonymous chat...",
    });
    // Use context function - setActiveChat will be called within useFirebaseChat hook
    await contextStartNewChat(userNickname);
  };

  const handleEndChat = () => {
    if (activeChat && user?.uid) {
      contextEndChat(activeChat, user.uid); // Use context function
    }
  };

  const handleSendFriendRequest = () => {
    if (activeChat) {
      contextSendFriendRequest(activeChat); // Use context function
      // No need to set local state anymore, status comes from hook
    }
  };

  const handleAcceptFriendRequest = () => {
    if (activeChatRequestId) {
      acceptFriendRequest(activeChatRequestId); // Call hook function with the ID
    } else {
      console.error("No active friend request ID found to accept.");
      toast({ title: "Error accepting request", variant: "destructive" });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() && !attachmentFile) return; // Also check attachment
    contextSendMessage(message, attachmentFile || undefined); // Use context function
    setMessage("");
    setAttachmentFile(null);
  };

  const handleAttachment = (file: File) => {
    setAttachmentFile(file);
    // Preview logic remains the same
    if (file.type.startsWith('image')) {
      const imageUrl = URL.createObjectURL(file);
      navigate("/image-viewer", { state: { imageUrl, isPreview: true } });
    } else if (file.type.startsWith('audio')) {
      const audioUrl = URL.createObjectURL(file);
      navigate("/voice-player", { state: { audioUrl, isPreview: true } });
    }
  };

  const viewAttachment = (attachment: { type: "image" | "voice"; url: string }) => {
    if (attachment.type === "image") {
      navigate("/image-viewer", { state: { imageUrl: attachment.url } });
    } else if (attachment.type === "voice") {
      navigate("/voice-player", { state: { audioUrl: attachment.url } });
    }
  };

  // Loading state is handled by Layout.tsx

  // Get current chat details from context chats array
  const currentChat = chats.find(chat => chat.id === activeChat);

  // Disable actions when offline
  const isNetworkDisabled = isOffline; // Simplified based on useOnlineStatus hook

  // Removed mappedChats as chats from context are already mapped

  return (
    // The outer div is now managed by Layout.tsx, we just provide the content
    <div className="flex-1 overflow-hidden h-full">
      {/* Main content area */}
      {activeChat ? (
        // Display chat interface if a chat is active
        <div className="h-full flex flex-col">
          <ChatHeader
            activeChat={activeChat}
            chatName={currentChat?.name}
            isOnline={currentChat?.online}
            isOffline={isNetworkDisabled}
            // onMobileMenuOpen is no longer needed
            onEndChat={handleEndChat}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest} // Pass accept handler
            friendRequestStatus={activeChatRequestStatus} // Pass status from hook
            nickname={userNickname} // Pass nickname if needed by header
          />

          <ChatMessageList
            activeChat={activeChat}
            currentUserId={user?.uid}
            messages={messages} // Pass messages directly from context
            isTyping={false} // Placeholder for typing indicator logic
            onNewChat={handleNewChat} // Keep CTA trigger? Or remove if only from main CTA?
            viewAttachment={viewAttachment}
          />

          <MessageInput
            message={message}
            isOffline={isNetworkDisabled}
            onMessageChange={(e) => setMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            onAttachment={handleAttachment}
          />
        </div>
      ) : (
        // Display "Start Chatting" CTA if no chat is active
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Welcome to Anonymous ChitChat!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ready to connect with someone new? Click the button below to start a random chat.
            </p>
            <Button
              size="lg"
              onClick={handleNewChat}
              disabled={isNetworkDisabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Chatting
            </Button>
            {isNetworkDisabled && (
              <p className="text-red-500 text-sm mt-4">You are offline. Please check your connection.</p>
            )}
          </div>
        </div>
      )}

      {/* Offline indicator - Keep it accessible */}
      <NetworkStatus userId={user?.uid} />
    </div>
  );
};

export default Index;
