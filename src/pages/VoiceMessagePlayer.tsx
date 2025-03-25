import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Play, Pause, X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Interface for user data
interface UserData {
  name: string;
  avatar?: string;
  timestamp: string;
}

const VoiceMessagePlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const audioUrl = location.state?.audioUrl || "";
  const userData: UserData = location.state?.userData || {
    name: "Anonymous User",
    timestamp: new Date().toLocaleString(),
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    // Clean up
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        toast({
          title: "Playback Error",
          description: "Could not play the audio file.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // For the prototype, we'll use a placeholder if no valid audio is provided
  if (!audioUrl) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold mb-4">Voice Message Playback</h2>
          <p className="text-muted-foreground mb-8">No audio file to play.</p>
          <Button onClick={handleClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-medium">Voice Message</h2>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Enhanced User Dashboard */}
      <div className="px-6 py-5 border-b bg-muted/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-primary">User Dashboard</h3>
          <Badge variant="outline" className="bg-primary/10 gap-1 py-1.5 pl-1.5 pr-2.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">Active Users: 8</span>
          </Badge>
        </div>
        
        <div className="flex items-center p-3 bg-background rounded-lg shadow-sm">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-primary">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background"></div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{userData.name}</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Online</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{userData.timestamp}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-16 w-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSliderChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
