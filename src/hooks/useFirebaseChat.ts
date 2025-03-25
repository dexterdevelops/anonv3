import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { 
  runTransaction,
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
  getDoc,
  limit, // <-- Import limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

// Helper function to create consistent friend document IDs
const createFriendDocId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join("_");
};

export interface Attachment {
  type: "image" | "voice";
  url: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "me" | "them" | "system";
  timestamp: Timestamp;
  attachment?: Attachment;
  status?: "sent" | "delivered" | "read";
  // Add fields for structured system messages here too
  type?: string; 
  requestSenderId?: string;
  requestReceiverId?: string;
  senderNickname?: string;
}

export interface FirebaseChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unread: number;
  online: boolean;
  participants: string[];
}

export function useFirebaseChat(userId: string | undefined) {
  const [chats, setChats] = useState<FirebaseChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      where("online", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData: FirebaseChat[] = [];
      snapshot.forEach((doc) => {
        const chat = { id: doc.id, ...doc.data() } as FirebaseChat;
        // Only include chats that are marked as online
        if (chat.online) {
          chatData.push(chat);
        }
      });

      // --- Auto-activate chat for waiting user ---
      // Check if the current activeChat state is null *before* potentially setting it.
      // This prevents overriding an already active chat if the snapshot updates.
      // We also check if exactly one 'online' chat exists for this user now.
      if (activeChat === null && chatData.length === 1) {
        const newChatId = chatData[0].id;
        console.log(`Auto-activating new chat for waiting user: ${newChatId}`);
        // Use a function update to safely set state based on previous state
        setActiveChat(prevActiveChat => {
          // Only update if it was indeed null before this snapshot update
          if (prevActiveChat === null) {
            return newChatId;
          }
          return prevActiveChat; // Otherwise, keep the existing active chat
        });
      }
      // --- End auto-activate ---

      setChats(chatData); // Update the list of chats
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
      toast({
        title: "Error fetching chats",
        description: err.message,
        variant: "destructive"
      });
    });

    // Cleanup inactive chats periodically
    const cleanupInterval = setInterval(async () => {
      try {
        const inactiveChatsQuery = query(
          collection(db, "chats"),
          where("participants", "array-contains", userId),
          where("online", "==", false)
        );
        
        const inactiveSnap = await getDocs(inactiveChatsQuery);
        inactiveSnap.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } catch (err) {
        console.error("Error cleaning up inactive chats:", err);
      }
    }, 300000); // Run every 5 minutes

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [userId, toast]);

  useEffect(() => {
    if (!activeChat || !userId) return;

    const q = query(
      collection(db, "chats", activeChat, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let processedSender: "me" | "them" | "system";
        if (data.senderId === userId) {
          processedSender = "me";
        } else if (data.senderId === "system") {
          processedSender = "system";
        } else {
          processedSender = "them";
        }
        // Ensure all potential fields are included when pushing to state
        messageData.push({
          id: doc.id,
          content: data.content, // May be undefined for some system messages
          sender: processedSender, 
          timestamp: data.timestamp,
          attachment: data.attachment,
          status: data.status,
          // Include system message fields if they exist in data
          type: data.type,
          requestSenderId: data.requestSenderId,
          requestReceiverId: data.requestReceiverId,
          senderNickname: data.senderNickname,
        } as Message); // Cast to Message to satisfy TypeScript
      });
      setMessages(messageData);
    }, (err) => {
      setError(err.message);
      toast({
        title: "Error fetching messages",
        description: err.message,
        variant: "destructive"
      });
    });

    markMessagesAsRead(activeChat, userId);

    return () => unsubscribe();
  }, [activeChat, userId, toast]);

  const markMessagesAsRead = async (chatId: string, userId: string) => {
    try {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        where("senderId", "!=", userId) // Only one '!=' filter allowed
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (document) => {
        const message = document.data();
        // Filter for status in code
        if (message.status !== "read") { 
          await updateDoc(doc(db, "chats", chatId, "messages", document.id), {
            status: "read"
          });
        }
      });

      await updateDoc(doc(db, "chats", chatId), {
        unread: 0
      });
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const sendMessage = async (content: string, attachment?: File) => {
    if (!activeChat || !userId || !content.trim()) return;

    try {
      let attachmentData: Attachment | undefined;

      if (attachment) {
        const storageRef = ref(storage, `chat-attachments/${activeChat}/${Date.now()}_${attachment.name}`);
        await uploadBytes(storageRef, attachment);
        const downloadUrl = await getDownloadURL(storageRef);
        
        const fileType = attachment.type.startsWith('image') ? 'image' : 'voice';
        attachmentData = {
          type: fileType as "image" | "voice",
          url: downloadUrl
        };
      }

      const messageData = {
        content,
        senderId: userId,
        timestamp: serverTimestamp(),
        status: "sent",
        ...(attachmentData && { attachment: attachmentData })
      };

      await addDoc(collection(db, "chats", activeChat, "messages"), messageData);

      await updateDoc(doc(db, "chats", activeChat), {
        lastMessage: content,
        lastMessageTime: serverTimestamp()
      });

      setTimeout(async () => {
        const q = query(
          collection(db, "chats", activeChat, "messages"),
          where("senderId", "==", userId),
          orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await updateDoc(doc(db, "chats", activeChat, "messages", querySnapshot.docs[0].id), {
            status: "delivered"
          });
        }
      }, 1000);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast({
          title: "Error sending message",
          description: err.message,
          variant: "destructive"
        });
      }
    }
  };

  const startNewChat = async (userNickname: string) => {
    if (!userId) return null;

    // Clean up previous chat state if exists
    if (activeChat) {
      await endChat(activeChat, userId);
      setMessages([]);
      setActiveChat(null);
    }

    // --- Refactored Logic ---
    // 1. Query for potential partners OUTSIDE the transaction
    const chatQueueRef = collection(db, "chat-queue");
    const partnerQuery = query(
      chatQueueRef,
      where("userId", "!=", userId), // Find someone else
      orderBy("timestamp", "asc"), // Get the oldest waiting user
      limit(5) // Look at a few potential partners to increase chances
    );

    let matchedChatId: string | null = null;

    try {
      const potentialPartnersSnapshot = await getDocs(partnerQuery);

      // 2. Run transaction to ATOMICALLY verify and match
      matchedChatId = await runTransaction(db, async (transaction) => {
        // Get current user's data within transaction
        const userRef = doc(db, "users", userId);
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();
        const nickname = userData?.nickname || userNickname;

        // Iterate through potential partners found outside transaction
        for (const potentialPartnerDoc of potentialPartnersSnapshot.docs) {
          const partnerId = potentialPartnerDoc.data().userId;
          const partnerNickname = potentialPartnerDoc.data().nickname || "Anonymous";
          const partnerQueueRef = doc(db, "chat-queue", partnerId); // Use partnerId for doc ref

          // Verify partner is STILL in the queue within the transaction
          const partnerQueueSnap = await transaction.get(partnerQueueRef);

          if (partnerQueueSnap.exists()) {
            // Partner is available! Perform the atomic match.
            console.log("startNewChat: Verified partner in queue:", partnerId);

            // Remove partner from queue
            transaction.delete(partnerQueueRef);

            // Remove current user from queue (if they exist)
            const currentUserQueueRef = doc(db, "chat-queue", userId);
            transaction.delete(currentUserQueueRef);

            // Create the chat
            const chatRef = doc(collection(db, "chats"));
            transaction.set(chatRef, {
              participants: [userId, partnerId],
              participantNicknames: {
                [userId]: nickname,
                [partnerId]: partnerNickname
              },
              lastMessage: "Chat started",
              lastMessageTime: serverTimestamp(),
              unread: 0,
              online: true,
              name: "Anonymous Chat"
            });

            // Add initial system message
            const messageRef = collection(db, "chats", chatRef.id, "messages");
            transaction.set(doc(messageRef), {
              content: "You're now chatting with a random stranger. Say hi!",
              senderId: "system",
              timestamp: serverTimestamp(),
              status: "read"
            });

            // Partner found - Set active chat directly instead of toast
            setActiveChat(chatRef.id); 
            console.log("Partner found, setting active chat:", chatRef.id); // Add log for debugging

            return chatRef.id; // Return the new chat ID - Match successful!
          }
          // If partnerQueueSnap didn't exist, they were matched by someone else, continue loop
        }

        // If loop finishes, no available partner was verified. Add current user to queue.
        const currentUserQueueRef = doc(db, "chat-queue", userId);
        const currentUserQueueSnap = await transaction.get(currentUserQueueRef);

        if (!currentUserQueueSnap.exists()) {
          console.log("startNewChat: Adding user to queue:", userId);
          transaction.set(currentUserQueueRef, {
            userId: userId,
            nickname: nickname, // Use the determined nickname
            timestamp: serverTimestamp()
          });
          toast({
            title: "Searching for partner...",
            description: "Added to queue. Please wait."
          });
        } else {
           console.log("startNewChat: User already in queue:", userId);
           toast({
            title: "Still Searching...",
            description: "You are already in the queue. Please wait."
          });
        }
        return null; // Indicate still waiting (no match made in this transaction)
      }); // End transaction

      return matchedChatId; // Return the result of the transaction

    } catch (error) { 
      // Handle errors from the initial query or the transaction
      console.error("Error in startNewChat:", error); // Log the error
      if (error instanceof Error) {
        setError(error.message);
        toast({
          title: "Error starting chat",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.error("An unexpected error occurred:", error); // Log unexpected errors
        setError("An unexpected error occurred.");
        toast({
          title: "Error starting chat",
          description: "An unexpected error occurred.",
          variant: "destructive"
        });
      }
  return null;
    }
  };

  const cancelChatSearch = async (userId: string) => {
    if (!userId) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userInQueueRef = doc(db, "chat-queue", userId);
        const userInQueueSnap = await transaction.get(userInQueueRef);

        if (userInQueueSnap.exists()) {
          transaction.delete(userInQueueRef);
          toast({
            title: "Search cancelled",
            description: "You have cancelled the search for a chat partner."
          });
        } else {
          toast({
            title: "Not in queue",
            description: "You are not currently in the queue."
          });
        }
      });
    } catch (error) {
      console.error("Error cancelling chat search:", error);
      toast({
        title: "Error cancelling search",
        description: "Failed to cancel the search. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteChat = async (chatId: string, userId: string) => {
    if (!chatId || !userId) return;

    try {
      await runTransaction(db, async (transaction) => {
        // Delete the chat document
        const chatRef = doc(db, "chats", chatId);
        transaction.delete(chatRef);

        // Optionally, update the UI immediately by removing the chat from the local state
        setChats(currentChats => currentChats.filter(c => c.id !== chatId));

        toast({
          title: "Chat Deleted",
          description: "Chat has been deleted from your end."
        });
        setActiveChat(null);
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error deleting chat",
        description: "Failed to delete the chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endChat = async (chatId: string, userId: string) => {
    if (!chatId || !userId) return;

    let partnerId: string | undefined;
    try {
      // Check if users are friends and get partnerId
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        partnerId = chatData.participants.find((id: string) => id !== userId);

        if (partnerId) {
          // Check friends collection using the helper function for consistency
          const friendDocId = createFriendDocId(userId, partnerId); // Use helper
          const friendDoc = await getDoc(doc(db, "friends", friendDocId));
          if (friendDoc.exists()) {
            toast({
              title: "Cannot end chat",
              description: "You are friends with this user. The chat will remain active."
            });
            return; // Don't end the chat if they are friends
          }
        }
      } else {
         console.warn("Chat document not found while trying to end chat:", chatId);
         // Proceed with UI cleanup even if doc is gone
         setChats(currentChats => currentChats.filter(c => c.id !== chatId));
         setActiveChat(null);
         return;
      }

      // Add system message *before* marking offline, so both users see it
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: "system",
        type: "chatEnded", // New message type
        endedBy: userId, // Record who initiated the end
        timestamp: serverTimestamp(),
        status: "read",
      });

      // Mark chat as offline instead of deleting immediately
      await updateDoc(doc(db, "chats", chatId), {
        online: false,
        lastMessageTime: serverTimestamp() // Update timestamp to help cleanup
      });

      // Remove from local state
      setChats(currentChats => currentChats.filter(c => c.id !== chatId));
      setActiveChat(null); // Clear active chat for the user who ended it

      toast({
        title: "Chat Ended",
        description: "The chat has been ended."
      });

    } catch (error) {
      console.error("Error ending chat:", error);
      toast({
        title: "Error ending chat",
        description: "Failed to end the chat. Please try again.",
        variant: "destructive"
      });
    }
  };


  const sendFriendRequest = async (chatId: string) => {
    if (!chatId || !userId) return;

    try {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const partnerId = chatData.participants.find((id: string) => id !== userId);

        // Fetch sender's nickname
        let senderNickname = "Anonymous";
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            senderNickname = userDoc.data()?.nickname || "Anonymous";
          }
        } catch (nickErr) {
          console.error("Error fetching sender nickname for system message:", nickErr);
        }

        // Add structured system message
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderId: "system",
          type: "friendRequestSent", // Indicate message type
          requestSenderId: userId,    // Store sender ID
          requestReceiverId: partnerId, // Store receiver ID
          senderNickname: senderNickname, // Store sender nickname
          timestamp: serverTimestamp(),
        status: "read" 
      });
        
        // Create the actual friend request document
        await setDoc(doc(db, "friendRequests", `${userId}_${partnerId}`), {
          senderId: userId,
          receiverId: partnerId, 
          status: "pending",
          timestamp: serverTimestamp(),
          chatId: chatId
        });
      }
      
      toast({
        title: "Friend Request Sent",
        description: "Friend request sent to this stranger."
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast({
          title: "Error sending friend request",
          description: err.message,
          variant: "destructive"
        });
      }
    }
  };

  return {
    chats,
    messages,
    activeChat,
    loading,
    error,
    setActiveChat,
    sendMessage,
    startNewChat,
    cancelChatSearch, // Added cancelChatSearch to the returned object
    endChat, // Modified endChat to call deleteChat
    sendFriendRequest
  };
}
