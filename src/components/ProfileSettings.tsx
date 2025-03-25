import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLayoutContext } from './Layout'; // Import context to access user info
import { Separator } from '@/components/ui/separator'; // Import Separator

const ProfileSettings: React.FC = () => {
  const { user } = useLayoutContext(); // Get user from context

  // Placeholder state for settings - replace with actual logic later
  const [darkMode, setDarkMode] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  // Get user initials for fallback avatar
  const getInitials = (name: string | null | undefined) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="p-4 h-full">
      {/* Single Card for Profile and Settings */}
      <Card className="h-full flex flex-col">
        {/* Profile Section */}
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{user?.displayName ?? 'Anonymous User'}</CardTitle>
            <p className="text-sm text-muted-foreground">{user?.email ?? 'No email'}</p>
          </div>
        </CardHeader>

        <Separator className="mb-4" /> {/* Separator between profile and settings */}

        {/* Settings Section */}
        <CardContent className="space-y-6 flex-grow overflow-y-auto">
          <CardTitle className="text-base mb-4">Settings</CardTitle> {/* Optional Title for Settings */}

          {/* Theme Setting */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Enable dark theme for the application.
              </span>
            </Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
              // Add theme switching logic here
            />
          </div>

          {/* Notifications Setting */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-1">
              <span>Enable Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive notifications for new messages and requests.
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              // Add notification enabling/disabling logic here
            />
          </div>

          {/* Add more settings sections as needed */}

        </CardContent>

        {/* Logout Button Removed */}
      </Card>
    </div>
  );
};

export default ProfileSettings;
