
import React from "react";

const TypingIndicator = () => {
  return (
    <div className="flex mb-4 justify-start animate-fade-in">
      <div className="chat-bubble-received py-3 px-4">
        <div className="flex space-x-1 items-center">
          <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
          <div className="h-2 w-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "400ms" }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
