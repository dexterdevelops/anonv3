import React, { useState, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import FriendList from './FriendList'; // Import FriendList
// import ProfileSettings from './ProfileSettings'; // Removed import - no longer used here
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Import auth hook
import { useFirebaseChat } from '@/hooks/useFirebaseChat'; // Import chat hook
import { User } from 'firebase/auth'; // Import User type if available, otherwise use 'any'
import { cn } from '@/lib/utils'; // Import cn utility
import { useEffect } from 'react'; // Import useEffect

// Define ChatItem type (consider moving to a shared types file later)
export interface ChatItem {
  id: string;
  name: string;
  lastMessage?: string;
  time?: string; // Formatted time string
  online?: boolean;
  photoURL?: string;
  participants?: string[];
  lastMessageTime?: any; // Keep original timestamp type if needed by other components
  unread?: number;
}

// Define Message type (replace 'any' with actual structure)
export interface Message {
  id: string;
  sender: "me" | "them" | "system"; // Updated sender type
  content: string;
  timestamp: any; // Firebase Timestamp or Date
  attachment?: { type: 'image' | 'voice'; url: string };
  system?: boolean; // For system messages like "User joined"
  // Add other message properties as needed
}

// Create Context for sharing chat state
interface LayoutContextProps {
  user: User | null; // Use Firebase User type or 'any'
  chats: ChatItem[];
  messages: Message[]; // Use defined Message type
  activeChat: string | null;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (message: string, attachment?: File) => void;
  startNewChat: (nickname: string) => Promise<string | null>;
  endChat: (chatId: string, userId: string) => void;
  sendFriendRequest: (chatId: string) => void;
  activeChatPartnerId: string | null; // Add partner ID
  // Add other necessary state/functions from useFirebaseChat if needed
}

export const LayoutContext = createContext<LayoutContextProps | null>(null);

// Custom hook to use the LayoutContext
export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutContextProvider');
  }
  return context;
};


type ActiveView = 'home' | 'friends' | 'profile';

const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // State to track if Friends panel is shown
  const navigate = useNavigate();
  const { user, loading: authLoading } = useFirebaseAuth(); // Use auth hook

  // --- Dark Mode State & Logic ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // Apply dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", darkMode.toString()); // Save dark mode preference immediately
  }, [darkMode]);
  // --- End Dark Mode ---


  // Use chat hook - ensure user?.uid is handled correctly during loading
  const {
    chats,
    messages,
    activeChat,
    loading: chatLoading,
    setActiveChat,
    sendMessage,
    startNewChat,
    endChat,
    sendFriendRequest,
  } = useFirebaseChat(user?.uid); // Pass user ID

  // Handle loading state
  if (authLoading || (user && chatLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 border-4 border-t-primary border-r-primary border-b-primary/30 border-l-primary/30 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    // Navigate and manage sidebar expansion based on view
    if (view === 'home') {
      setIsSidebarExpanded(false); // Hide Friends panel
      if (window.location.pathname !== '/chat') {
         navigate('/chat'); // Navigate main area to chat
      }
    } else if (view === 'profile') {
      setIsSidebarExpanded(false); // Hide Friends panel
      if (window.location.pathname !== '/settings') {
         navigate('/settings'); // Navigate main area to settings
      }
    } else if (view === 'friends') {
      setIsSidebarExpanded(true); // Show Friends panel
      // Ensure we are not on the settings page if friends is clicked
      if (window.location.pathname === '/settings') {
         navigate('/chat'); // Navigate back to chat if settings was open
      }
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    setActiveView('home'); // Switch view back to home (chat view)
    setIsSidebarExpanded(false); // Hide Friends panel when a chat is selected
    // Ensure we are on the chat page
    if (window.location.pathname !== '/chat') {
       navigate('/chat');
    }
  };

  // Prepare chat data for FriendList
  const mappedChatsForList: ChatItem[] = chats.map(chat => ({
     id: chat.id,
     name: chat.name,
     lastMessage: chat.lastMessage,
     // Format time safely
     time: chat.lastMessageTime?.toDate ? chat.lastMessageTime.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
     online: chat.online,
     photoURL: undefined, // Add photoURL if available in your chat data structure
     participants: chat.participants,
     lastMessageTime: chat.lastMessageTime,
     unread: chat.unread,
  }));

  // Placeholder for actual friends data - fetch or integrate later
  // const friendsData: ChatItem[] = []; // Removed - FriendList will only show saved chats now

  // Filter out the active chat from the list passed to FriendList
  const savedChats = mappedChatsForList.filter(chat => chat.id !== activeChat);

  // Calculate active chat partner ID
  const activeChatData = mappedChatsForList.find(chat => chat.id === activeChat);
  const activeChatPartnerId = activeChatData?.participants?.find(p => p !== user?.uid) || null;


  // Context value
  const contextValue: LayoutContextProps = {
    user,
    chats: mappedChatsForList,
    messages,
    activeChat,
    setActiveChat,
    sendMessage,
    startNewChat,
    endChat,
    sendFriendRequest,
    activeChatPartnerId, // Add partner ID to context
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="flex h-screen bg-background">
        {/* Sidebar is always present and narrow */}
        <Sidebar 
          onNavigate={handleNavigate} 
          activeView={activeView}
          darkMode={darkMode} // Pass state down
          setDarkMode={setDarkMode} // Pass setter down
        />
        
        {/* Conditionally render FriendList panel */}
        {isSidebarExpanded && activeView === 'friends' && (
          // This panel has a fixed width next to the sidebar. Removed flex-1.
          <div className="w-60 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0"> 
             <FriendList
               // friends prop removed
               savedChats={savedChats} // Pass only non-active chats
               activeChatId={activeChat} // Still needed for potential highlighting (though maybe not relevant now)
               onSelectChat={handleChatSelect}
           />
          </div>
        )}

        {/* Main content area (Chat or Settings) - Always visible and takes remaining space */}
        <main className="flex-1 overflow-y-auto">
          {/* Outlet renders the matched route's component (/chat or /settings) */}
          <Outlet />
        </main>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
