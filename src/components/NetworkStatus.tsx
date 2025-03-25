
import React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface NetworkStatusProps {
  userId?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ userId }) => {
  const { isOffline } = useOnlineStatus(userId);
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="glass-panel bg-destructive/10 text-destructive px-4 py-2 rounded-full shadow-lg flex items-center">
        <span className="mr-2">Connection lost. Reconnecting...</span>
        <div className="h-2 w-2 bg-destructive rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default NetworkStatus;
