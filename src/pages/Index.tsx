import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Import loader icon
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
// Removed useIsMobile import as it's not used directly here
import ChatHeader from "@/components/ChatHeader";
import ChatMessageList from "@/components/ChatMessageList";
import MessageInput from "@/components/MessageInput";
import NetworkStatus from "@/components/NetworkStatus";
import { generateFunkyName } from "@/utils/nameGenerator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useFriendRequests } from "@/hooks/useFriendRequests"; // Import friend request hook
import { useLayoutContext, ChatItem, Message } from '@/components/Layout'; // Import context hook and types

const Index = () => {
  const [message, setMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState(false); // Add searching state
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get state and functions from LayoutContext
  const {
    user,
    chats,
    messages,
    activeChat,
    sendMessage: contextSendMessage,
    startNewChat: contextStartNewChat,
    endChat: contextEndChat,
    sendFriendRequest: contextSendFriendRequest,
    activeChatPartnerId,
    // Add cancelChatSearch if implemented in LayoutContext/useFirebaseChat
    // cancelChatSearch: contextCancelSearch,
  } = useLayoutContext();

  // Use the friend request hook for the active chat
  const {
    activeChatRequestStatus,
    activeChatRequestId,
    acceptFriendRequest,
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
  const { isOffline } = useOnlineStatus(user?.uid); // Simplified: only need isOffline

  const handleNewChat = async () => {
    // Don't show initial toast, use searching indicator instead
    setIsSearching(true); // Set searching state to true
    try {
      // Use context function - setActiveChat will be called within useFirebaseChat hook if match found
      await contextStartNewChat(userNickname);
      // If the function completes and activeChat is still null, it means the user was added to the queue.
      // The searching state will remain true until a chat becomes active or the user cancels.
      // We might need a way to cancel the search.
    } catch (error) {
      console.error("Error starting new chat:", error);
      // Optionally show an error toast here
      setIsSearching(false); // Reset searching state on error
    }
    // Removed finally block - keep searching indicator if added to queue
  };

  // Effect to stop searching indicator if activeChat becomes available
  useEffect(() => {
    if (activeChat) {
      setIsSearching(false);
    }
  }, [activeChat]);

  // Optional: Add a function to handle cancelling the search
  // const handleCancelSearch = async () => {
  //   if (user?.uid && contextCancelSearch) { // Check if cancel function exists
  //     await contextCancelSearch(user.uid);
  //     setIsSearching(false);
  //   }
  // };

  const handleEndChat = () => {
    if (activeChat && user?.uid) {
      contextEndChat(activeChat, user.uid); // Use context function
    }
  };

  const handleSendFriendRequest = () => {
    if (activeChat) {
      contextSendFriendRequest(activeChat); // Use context function
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

  // Get current chat details from context chats array
  const currentChat = chats.find(chat => chat.id === activeChat);

  // Disable actions when offline
  const isNetworkDisabled = isOffline;

  return (
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
            onEndChat={handleEndChat}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            friendRequestStatus={activeChatRequestStatus}
            nickname={userNickname}
          />
          <ChatMessageList
            activeChat={activeChat}
            currentUserId={user?.uid}
            messages={messages}
            isTyping={false} // Placeholder
            onNewChat={handleNewChat} // Keep CTA trigger?
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
      ) : isSearching ? (
        // Display Searching indicator
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center p-8 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Searching for a partner...</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we connect you with someone.
            </p>
            {/* Optional: Add Cancel Button */}
            {/* <Button variant="outline" onClick={handleCancelSearch} disabled={isNetworkDisabled}>
              Cancel Search
            </Button> */}
            {isNetworkDisabled && (
              <p className="text-red-500 text-sm mt-4">You are offline. Please check your connection.</p>
            )}
          </div>
        </div>
      ) : (
        // Display "Start Chatting" CTA if no chat is active and not searching
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

      {/* Offline indicator */}
      <NetworkStatus userId={user?.uid} />
    </div>
  );
};

export default Index;
