import { useState, useEffect } from 'react';
import { realtimeDb } from '../lib/firebase';
import { ref, onDisconnect, onValue, set, serverTimestamp } from 'firebase/database';
import { useFirebaseAuth } from './useFirebaseAuth';

export const useOnlineStatus = (userId?: string) => {
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!userId) return;

    // Reference to user's presence in Firebase
    const userStatusRef = ref(realtimeDb, `status/${userId}`);
    const usersRef = ref(realtimeDb, 'status');

    // Set user to online
    set(userStatusRef, {
      online: true,
      lastChanged: serverTimestamp()
    });

    // Set user to offline when they disconnect
    onDisconnect(userStatusRef).set({
      online: false,
      lastChanged: serverTimestamp()
    });

    // Listen for all users' online status
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const onlineUsers: Record<string, boolean> = {};
        let count = 0;

        Object.keys(users).forEach((uid) => {
          if (users[uid].online) {
            onlineUsers[uid] = true;
            count++;
          }
        });

        setOnlineUsers(onlineUsers);
        setActiveUsersCount(count);
      } else {
        setOnlineUsers({});
        setActiveUsersCount(0);
      }
    });

    return () => {
      // Clean up listener
      unsubscribe();
      // Set offline when component unmounts
      set(userStatusRef, {
        online: false,
        lastChanged: serverTimestamp()
      });
    };
  }, [userId]);

  return { activeUsersCount, onlineUsers };
};
