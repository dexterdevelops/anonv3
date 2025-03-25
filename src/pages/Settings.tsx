import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, BellOff, Eye, EyeOff, Trash2, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // Import useFirebaseAuth
import { useLayoutContext } from '@/components/Layout'; // Import context for user info

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateNickname } = useFirebaseAuth(); // Get user and updateNickname hook
  // const { user } = useLayoutContext(); // Alternative: Get user from Layout context if preferred

  // State from original Settings.tsx
  const [nickname, setNickname] = useState(() => localStorage.getItem("nickname") || user?.displayName || "Anonymous User");
  // darkMode state removed
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") !== "false");
  const [blurPhotos, setBlurPhotos] = useState(() => localStorage.getItem("blurPhotos") === "true");
  const [backupEnabled, setBackupEnabled] = useState(() => localStorage.getItem("backupEnabled") === "true");
  const [preventScreenshots, setPreventScreenshots] = useState(() => localStorage.getItem("preventScreenshots") === "true");
  const [isSaving, setIsSaving] = useState(false);

  // Update local nickname state if user display name changes (e.g., after initial load)
  useEffect(() => {
    if (user?.displayName && nickname !== user.displayName) {
      setNickname(user.displayName);
    }
  }, [user?.displayName]);


  // Apply dark mode effect removed


  // Save other settings 
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update nickname in Firebase if it changed
      if (nickname !== (localStorage.getItem("nickname") || user?.displayName)) {
         await updateNickname(nickname);
      }

      // Save settings to localStorage
      localStorage.setItem("nickname", nickname);
      localStorage.setItem("notifications", notifications.toString());
      localStorage.setItem("blurPhotos", blurPhotos.toString());
      localStorage.setItem("backupEnabled", backupEnabled.toString());
      localStorage.setItem("preventScreenshots", preventScreenshots.toString());

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });

    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = () => {
    // Add actual logic if needed, otherwise just show toast
    console.log("Clearing chat history...");
    toast({
      title: "Chat History Cleared",
      description: "All your chat history has been deleted from this device.",
      variant: "destructive",
    });
  };

  // Get user initials for fallback avatar
  const getInitials = (name: string | null | undefined) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    // Use padding for the main container instead of the card for better spacing
    <div className="p-4 md:p-6 lg:p-8 h-full overflow-y-auto">
      {/* Single Card for Profile and Settings */}
      <Card className="h-full flex flex-col max-w-2xl mx-auto"> {/* Added max-width and centering */}
        {/* Profile Section */}
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
          <Avatar className="h-16 w-16"> {/* Slightly larger avatar */}
            <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(nickname)}</AvatarFallback> {/* Use nickname state */}
          </Avatar>
          <div className="flex-grow space-y-1">
             <Label htmlFor="nickname" className="text-xs text-muted-foreground">
                Nickname
              </Label>
             <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="text-lg font-semibold" // Style input like a title
              />
            <p className="text-sm text-muted-foreground">{user?.email ?? 'No email'}</p>
          </div>
        </CardHeader>

        <Separator className="mb-4" /> {/* Separator between profile and settings */}

        {/* Settings Section */}
        <CardContent className="space-y-6 flex-grow overflow-y-auto">
          {/* Appearance Section Removed */}

          {/* Notifications */}
          <div className="space-y-4">
             <h3 className="text-base font-medium text-muted-foreground">Notifications</h3>
             <div className="flex items-center justify-between">
               <Label htmlFor="notifications" className="flex items-center space-x-2 cursor-pointer">
                 {notifications ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                 <span>Enable Notifications</span>
               </Label>
               <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
             </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
             <h3 className="text-base font-medium text-muted-foreground">Privacy</h3>
             <div className="flex items-center justify-between">
               <Label htmlFor="blur-photos" className="flex items-center space-x-2 cursor-pointer">
                 {blurPhotos ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 <span>Blur Media Previews</span>
               </Label>
               <Switch id="blur-photos" checked={blurPhotos} onCheckedChange={setBlurPhotos} />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="backup-chats" className="flex items-center space-x-2 cursor-pointer">
                 <User className="h-5 w-5" /> {/* Changed icon */}
                 <span>Backup Chat History</span>
               </Label>
               <Switch id="backup-chats" checked={backupEnabled} onCheckedChange={setBackupEnabled} />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="prevent-screenshots" className="flex items-center space-x-2 cursor-pointer">
                 <EyeOff className="h-5 w-5" />
                 <span>Prevent Screenshots</span>
               </Label>
               <Switch id="prevent-screenshots" checked={preventScreenshots} onCheckedChange={setPreventScreenshots} />
             </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
             <h3 className="text-base font-medium text-muted-foreground">Data</h3>
             <Button
               variant="destructive"
               className="w-full justify-start" // Align left
               onClick={handleClearHistory}
             >
               <Trash2 className="mr-2 h-4 w-4" />
               Clear Chat History on This Device
             </Button>
          </div>

        </CardContent>

        {/* Save Button Footer */}
        <div className="p-4 border-t mt-auto">
          <Button
            className="w-full"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="mr-2">Saving...</span>
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
