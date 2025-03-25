
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const ImageViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const imageUrl = location.state?.imageUrl || "/placeholder.svg";
  const [scale, setScale] = useState(1);
  
  const handleClose = () => {
    navigate(-1);
  };
  
  const handleDownload = () => {
    // In a real app, this would download the image
    console.log("Download image:", imageUrl);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 flex items-center justify-between safe-top">
        <Button variant="ghost" size="icon" onClick={handleClose} className="text-white rounded-full bg-black/30 backdrop-blur-md">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white rounded-full bg-black/30 backdrop-blur-md">
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white rounded-full bg-black/30 backdrop-blur-md">
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white rounded-full bg-black/30 backdrop-blur-md">
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-white rounded-full bg-black/30 backdrop-blur-md">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt="Full size preview" 
            className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
      
      <div className="p-4 text-center text-white/70 text-sm">
        Tap and pinch to zoom (or use zoom controls)
      </div>
    </div>
  );
};

export default ImageViewer;
