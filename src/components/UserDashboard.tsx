import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, DocumentData } from "firebase/firestore";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import ActiveUsers from "@/components/ActiveUsers";

interface Friend {
  id: string;
  users: string[];
  since: Date;
  nickname?: string;
  email?: string;
  photoURL?: string;
  isFavorite?: boolean; // Added new field
}

interface FriendRequest {
  id: string;
  senderId: string;
  timestamp: Date;
}

const UserDashboard = () => {
  const { user } = useFirebaseAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  // ... (previous useEffect logic remains the same) ...

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="text-2xl">
                {user?.displayName?.charAt(0).toUpperCase() || 
                 user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.displayName || user?.email || "User"}
              </h1>
              {user?.email && (
                <p className="text-gray-600">{user.email}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Active Users</h2>
          <ActiveUsers />
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Friends</h2>
            {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {friends.map((friend) => (
              <Card key={friend.id} className="hover:shadow-lg transition-all duration-200 border rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={friend.photoURL} alt={friend.nickname || "Friend"} />
                      <AvatarFallback className="bg-gray-100 text-lg">
                        {(friend.nickname || "F").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold truncate">
                          {friend.nickname || "Friend"}
                        </h3>
                        <span className="text-yellow-500 text-lg">★</span>
                      </div>
                      {friend.email && (
                        <p className="text-sm text-gray-600 truncate">
                          {friend.email}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Friends since:</span> {format(friend.since, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No friends yet</p>
            )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Requests</h2>
            {friendRequests.length > 0 ? (
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>R</AvatarFallback>
                  </Avatar>
                  <span>Request from user {request.senderId}</span>
                </div>
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                    Accept
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending requests</p>
        )}
        </section>
      </div> 
      */}
    </div>
  );
};

export default UserDashboard;
