import React from 'react';
import { Home, Users, User, Moon, Sun } from 'lucide-react'; // Keep Moon, Sun
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
// Switch and Label imports removed

interface SidebarProps {
  onNavigate: (view: 'home' | 'friends' | 'profile') => void;
  activeView: 'home' | 'friends' | 'profile';
  darkMode: boolean; // Add darkMode prop
  setDarkMode: (value: boolean) => void; // Add setDarkMode prop
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  activeView, 
  darkMode, // Destructure darkMode
  setDarkMode // Destructure setDarkMode
}) => { 
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
    // Removed Profile from the main nav items
  ] as const; // Use 'as const' for stricter type checking on 'id'

  return (
    <div
      className={cn(
        'h-screen bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-shrink-0 w-16' // Ensure it's always w-16
      )}
    >
      {/* Icon Navigation Column */}
      <div className="w-16 flex flex-col justify-between items-center py-4 flex-shrink-0">
        {/* Top Icons */}
        <nav className="flex flex-col items-center space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'flex items-center justify-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 h-10 w-10', // Always icon-only style
                activeView === item.id && 'bg-gray-200 dark:bg-gray-700'
              )}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          ))}
        </nav>
        {/* Bottom Icons (Dark Mode Button & Profile) */}
        <div className="mb-4 flex flex-col items-center space-y-2">
           {/* Dark Mode Button */}
           <Button
              variant="ghost"
              className={cn(
                'flex items-center justify-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 h-10 w-10'
              )}
              onClick={() => setDarkMode(!darkMode)} // Toggle dark mode on click
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} {/* Show opposite icon */}
            </Button>
           {/* Profile Button */}
           <Button
              variant="ghost"
              className={cn(
                'flex items-center justify-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 h-10 w-10',
                 // Highlight if profile view is active
                activeView === 'profile' && 'bg-gray-200 dark:bg-gray-700'
              )}
              onClick={() => onNavigate('profile')} // Call onNavigate with 'profile'
              aria-label="Profile" // Updated aria-label
            >
              {/* Icon is User */}
              <User className="h-5 w-5" /> 
            </Button>
        </div>
      </div>

      {/* REMOVED: Expanded Content Area div - This is now handled entirely in Layout.tsx */}
      
    </div>
  );
};

export default Sidebar;
