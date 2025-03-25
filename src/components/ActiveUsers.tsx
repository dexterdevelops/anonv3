import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const ActiveUsers: React.FC = () => {
  const { user } = useFirebaseAuth();
  const userId = user?.uid;
  const { activeUsersCount, onlineUsers } = useOnlineStatus(userId); // Get onlineUsers as well

  console.log("ActiveUsers Component - Online Users Data:", onlineUsers); // Log onlineUsers data

  return (
    <div style={{ fontWeight: 'bold', color: '#333', padding: '8px 12px', borderRadius: '4px', marginTop: '10px', display: 'inline-block', backgroundColor: '#f0f0f0' }}>
      Active Users: {activeUsersCount}
    </div>
  );
};

export default ActiveUsers;
