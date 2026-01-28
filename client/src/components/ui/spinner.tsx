import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return <Loader2 className={cn("h-10 w-10 animate-spin text-primary", className)} />;
}
