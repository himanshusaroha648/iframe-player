import { useQuery } from "@tanstack/react-query";

export interface VideoData {
  m3u8_url: string;
  name_title: string;
}

export function useVideoData(videoId: string | undefined) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      if (!videoId) throw new Error("No video ID provided");

      // Check if data is already injected in window
      if (typeof window !== "undefined" && (window as any).__VIDEO_DATA__) {
        const data = (window as any).__VIDEO_DATA__;
        return data as VideoData;
      }

      const response = await fetch(`/api/video/${videoId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Video not found");
      }

      const data = await response.json();
      return data as VideoData;
    },
    enabled: !!videoId,
    retry: false,
  });
}
