import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseChat } from '@/hooks/useFirebaseChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ChatList from '@/components/ChatList';
import ChatMessageList from '@/components/ChatMessageList';
import MessageInput from '@/components/MessageInput';
import NetworkStatus from '@/components/NetworkStatus';
import { useToast } from '@/hooks/use-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading } = useFirebaseAuth();
  const { isOnline } = useOnlineStatus(user?.uid);
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to welcome if not authenticated
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const { 
    chats,
    messages,
    activeChat,
    setActiveChat,
    sendMessage,
    loading: chatLoading,
    error
  } = useFirebaseChat(user?.uid);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 border-4 border-t-primary border-r-primary border-b-primary/30 border-l-primary/30 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <NetworkStatus isOnline={isOnline} />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border">
          <ChatList 
            chats={chats} 
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            loading={chatLoading}
          />
        </div>
        
        <div className="flex-1 flex flex-col">
          <ChatMessageList 
            messages={messages}
            loading={chatLoading}
          />
          
          <MessageInput 
            onSendMessage={sendMessage}
            disabled={!activeChat || !isOnline}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;