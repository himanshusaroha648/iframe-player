import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="bg-card w-full max-w-md p-8 rounded-2xl border border-border/50 shadow-2xl shadow-black/40 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-destructive/5">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            The link you followed may be broken, or the page may have been removed.
          </p>
        </div>

        <div className="pt-4">
          <div className="inline-block px-4 py-2 bg-zinc-900 rounded text-xs text-zinc-500 font-mono">
            Error 404
          </div>
        </div>
      </div>
    </div>
  );
}
