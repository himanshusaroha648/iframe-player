import { useParams } from "wouter";
import { useVideoData } from "@/hooks/use-video-data";
import VideoPlayer from "@/components/VideoPlayer";
import { Spinner } from "@/components/ui/spinner";
import { Film } from "lucide-react";

export default function VideoPage() {
  const params = useParams();
  const videoId = params.videoId;
  const { data: video, isLoading, error } = useVideoData(videoId);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Spinner className="w-12 h-12" />
        <p className="text-muted-foreground animate-pulse text-sm tracking-wider uppercase">Loading Stream...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-screen h-screen bg-background flex flex-col items-center justify-center space-y-6 p-4">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center shadow-inner border border-zinc-800">
          <Film className="w-10 h-10 text-zinc-600" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Video Not Found</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The video ID you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background text-foreground overflow-hidden">
      <VideoPlayer 
        src={video.m3u8_url} 
        title={video.name_title || "Untitled Video"} 
      />
    </div>
  );
}
