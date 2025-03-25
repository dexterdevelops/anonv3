
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import Layout from "./components/Layout"; // Import the new Layout component
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Settings from "./pages/Settings"; // Restore import
import NotFound from "./pages/NotFound";
import ImageViewer from "./pages/ImageViewer";
import VoiceMessagePlayer from "./pages/VoiceMessagePlayer";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useFirebaseAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 border-4 border-t-primary border-r-primary border-b-primary/30 border-l-primary/30 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{element}</> : <Navigate to="/" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Wrap protected routes with the Layout component */}
          <Route element={<ProtectedRoute element={<Layout />} />}>
            <Route path="/chat" element={<Index />} /> 
            <Route path="/settings" element={<Settings />} /> {/* Restore settings route */}
            {/* Add other protected routes here if needed */}
          </Route>
          
          {/* Public routes */}
          <Route path="/image-viewer" element={<ImageViewer />} />
          <Route path="/voice-player" element={<VoiceMessagePlayer />} />
          <Route path="/" element={<Welcome />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
