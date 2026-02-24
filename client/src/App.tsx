import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VideoPage from "@/pages/VideoPage";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-4 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2 font-display">Video Player</h1>
            <p className="text-muted-foreground">Please use a valid video URL (e.g., /v/videoId)</p>
          </div>
        </div>
      </Route>
      {/* 
        Video Route: /v/:videoId 
        Matches: /v/123456
      */}
      <Route path="/v/:videoId" component={VideoPage} />
      
      {/* 
        Default fallback for any other route is 404 
        Since this is an embed player, we don't have a home page
      */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
