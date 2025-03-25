
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const NotFound = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link to="/">
        <Button>Return to Chat</Button>
      </Link>
    </div>
  );
};

export default NotFound;
