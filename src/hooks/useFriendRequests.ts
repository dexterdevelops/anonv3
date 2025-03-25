import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  addDoc,
  getDoc,
  DocumentData, // Import DocumentData
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export interface FriendRequest {
  id: string; // Firestore document ID (e.g., senderId_receiverId)
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: Timestamp;
  chatId: string; // To potentially send system messages back to the chat
  // Optional: Add senderNickname if needed for display
  senderNickname?: string;
}

export type FriendRequestStatus = "none" | "sent" | "received" | "accepted";

// Helper function to create consistent friend document IDs
const createFriendDocId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join("_");
};

export function useFriendRequests(userId: string | undefined, activeChatPartnerId: string | null) {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [activeChatRequestStatus, setActiveChatRequestStatus] = useState<FriendRequestStatus>("none");
  const [activeChatRequestId, setActiveChatRequestId] = useState<string | null>(null); // Store the ID for accept/reject
  const [loadingIncoming, setLoadingIncoming] = useState(true); // Separate loading for general incoming list
  const [loadingActiveStatus, setLoadingActiveStatus] = useState(false); // Separate loading for active chat status
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Effect for general incoming requests (for notifications/sidebar)
  useEffect(() => {
    if (!userId) {
      setIncomingRequests([]);
      setLoadingIncoming(false);
      return;
    }

    setLoadingIncoming(true);
    const q = query(
      collection(db, "friendRequests"),
      where("receiverId", "==", userId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Fetch requests and sender nicknames concurrently
      const requestsPromises = snapshot.docs.map(async (docSnapshot) => {
        const requestData = docSnapshot.data() as Omit<FriendRequest, 'id' | 'senderNickname'>;
        let senderNickname = "Anonymous";
        try {
          const userDoc = await getDoc(doc(db, "users", requestData.senderId));
          if (userDoc.exists()) {
            senderNickname = userDoc.data()?.nickname || "Anonymous";
          }
        } catch (nickErr) {
          console.error("Error fetching sender nickname:", nickErr);
        }
        return {
          id: docSnapshot.id,
          ...requestData,
          senderNickname
        } as FriendRequest;
      });

      try {
        const requests = await Promise.all(requestsPromises);
        setIncomingRequests(requests);
      } catch (processingError) {
         console.error("Error processing friend requests:", processingError);
         setError("Failed to process friend requests.");
         setIncomingRequests([]);
      } finally {
        setLoadingIncoming(false);
      }
    }, (err) => {
      console.error("Error fetching friend requests:", err);
      setError(err.message);
      setLoadingIncoming(false);
      toast({
        title: "Error fetching friend requests",
        description: err.message,
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [userId, toast]);


  // Effect for the specific friend request status in the active chat
  useEffect(() => {
    if (!userId || !activeChatPartnerId) {
      setActiveChatRequestStatus("none");
      setActiveChatRequestId(null);
      setLoadingActiveStatus(false);
      return;
    }

    setLoadingActiveStatus(true);
    setActiveChatRequestStatus("none"); // Reset status initially
    setActiveChatRequestId(null);

    const possibleId1 = `${userId}_${activeChatPartnerId}`;
    const possibleId2 = `${activeChatPartnerId}_${userId}`;

    // Listener for the request document (regardless of sender/receiver)
    const setupListener = (requestId: string) => {
      const docRef = doc(db, "friendRequests", requestId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData; // Use DocumentData
          setActiveChatRequestId(docSnap.id); // Store the actual ID found
          if (data.status === "pending") {
            if (data.senderId === userId) {
              setActiveChatRequestStatus("sent");
            } else {
              setActiveChatRequestStatus("received");
            }
          } else if (data.status === "accepted") {
            setActiveChatRequestStatus("accepted");
          } else {
            // Rejected or other statuses, treat as 'none' for the header UI
            setActiveChatRequestStatus("none");
            setActiveChatRequestId(null); // Clear ID if not pending/accepted
          }
        } else {
          // Document doesn't exist or was deleted (e.g., rejected and deleted)
          setActiveChatRequestStatus("none");
          setActiveChatRequestId(null);
        }
        setLoadingActiveStatus(false);
      }, (err) => {
        console.error(`Error listening to friend request ${requestId}:`, err);
        setError(err.message);
        setActiveChatRequestStatus("none");
        setActiveChatRequestId(null);
        setLoadingActiveStatus(false);
        // Optional: Toast notification for listener error
      });
    };

    // Try listening to both possible IDs, one will likely fail if doc doesn't exist
    const unsubscribe1 = setupListener(possibleId1);
    const unsubscribe2 = setupListener(possibleId2);


    // Check if they are already friends (overrides request status)
    const checkFriendship = async () => {
        const friendDocId = createFriendDocId(userId, activeChatPartnerId);
        const friendDocRef = doc(db, "friends", friendDocId);
        try {
            const friendSnap = await getDoc(friendDocRef);
            if (friendSnap.exists()) {
                setActiveChatRequestStatus("accepted"); // Treat existing friends as 'accepted' for UI
                setActiveChatRequestId(null); // No pending request ID needed
                setLoadingActiveStatus(false);
            }
        } catch (err) {
            console.error("Error checking friendship status:", err);
            // Don't override status if check fails, rely on request listener
        }
    };

    checkFriendship(); // Check friendship status after setting up listeners


    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [userId, activeChatPartnerId, toast]);


  const acceptFriendRequest = async (requestId: string) => { // Accept by ID now
    if (!userId || !requestId) return;

    const requestDocRef = doc(db, "friendRequests", requestId);

    try {
      // Fetch the request details first to get sender/receiver/chatId
      const requestSnap = await getDoc(requestDocRef);
      if (!requestSnap.exists()) {
        throw new Error("Friend request not found.");
      }
      const request = { id: requestSnap.id, ...requestSnap.data() } as FriendRequest;

      if (request.receiverId !== userId) {
        throw new Error("Cannot accept a request not sent to you.");
      }
      if (request.status !== 'pending') {
         toast({ title: "Request already actioned", variant: "default" });
         return; // Already accepted or rejected
      }

      // 1. Update the request status
      await updateDoc(requestDocRef, {
        status: "accepted",
      });

      // 2. Create a friendship document
      const friendDocId = createFriendDocId(request.senderId, request.receiverId);
      await setDoc(doc(db, "friends", friendDocId), {
        participants: [request.senderId, request.receiverId],
        createdAt: serverTimestamp(),
      });

      // 3. Send structured system message to the chat
      if (request.chatId) {
        await addDoc(collection(db, "chats", request.chatId, "messages"), {
          senderId: "system",
          type: "friendRequestAccepted", // New message type
          requestSenderId: request.senderId, // User who originally sent
          requestReceiverId: request.receiverId, // User who accepted (current user)
          timestamp: serverTimestamp(),
          status: "read",
        });
      }

      // 4. Remove from local incomingRequests state (if it was there)
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      // The activeChatRequestStatus will update via its own listener

      toast({
        title: "Friend Request Accepted",
      });

    } catch (err) {
      console.error("Error accepting friend request:", err);
       if (err instanceof Error) {
         setError(err.message);
         toast({
           title: "Error accepting request",
           description: err.message,
           variant: "destructive",
         });
       }
    }
  };

  const rejectFriendRequest = async (requestId: string) => { // Reject by ID
     if (!userId || !requestId) return;

     const requestDocRef = doc(db, "friendRequests", requestId);

    try {
       // Fetch the request details first to get chatId etc.
      const requestSnap = await getDoc(requestDocRef);
      if (!requestSnap.exists()) {
        // Already gone, maybe deleted by sender or expired
        toast({ title: "Request not found", variant: "default" });
        return;
      }
      const request = { id: requestSnap.id, ...requestSnap.data() } as FriendRequest;

      if (request.receiverId !== userId && request.senderId !== userId) {
          throw new Error("Cannot reject a request not involving you.");
      }
       if (request.status !== 'pending') {
         toast({ title: "Request already actioned", variant: "default" });
         return; // Already accepted or rejected
      }


      // Option A: Update status (useful if you want to show rejected state)
      // await updateDoc(requestDocRef, { status: "rejected" });
      // Option B: Delete document (simpler, aligns with prompt where it just disappears if not accepted)
      await deleteDoc(requestDocRef);

      // (Optional) Send system message - Prompt doesn't explicitly require one for rejection
       // if (request.chatId) {
       //   await addDoc(collection(db, "chats", request.chatId, "messages"), {
       //     content: `Friend request rejected.`, // Customize message
       //     senderId: "system",
       //     timestamp: serverTimestamp(),
       //     status: "read",
       //   });
       // }

      // Remove from local incoming state
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      // activeChatRequestStatus will update via listener (to 'none' as doc is deleted)

      toast({
        title: "Friend Request Removed", // More neutral if deleting
      });

    } catch (err) {
       console.error("Error rejecting/removing friend request:", err);
       if (err instanceof Error) {
         setError(err.message);
         toast({
           title: "Error removing request",
           description: err.message,
           variant: "destructive",
         });
       }
    }
  };

  return {
    incomingRequests, // General list for notifications etc.
    activeChatRequestStatus, // Status for the header UI
    activeChatRequestId, // ID needed for accept/reject actions
    loading: loadingIncoming || loadingActiveStatus, // Combined loading state
    error,
    acceptFriendRequest,
    rejectFriendRequest, // Keep reject/remove logic available
  };
}
