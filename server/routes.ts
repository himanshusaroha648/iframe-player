import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";

const SUPABASE_URL = "https://ygzatbhatbafsqqehxzw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MTgsP8fRRVVwZIObMnoJ1A_Uo3jysRN";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API route to fetch video data from Supabase
  app.get("/api/video/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      if (!videoId) return res.status(400).json({ error: "Video ID is required" });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/iframe?select=m3u8_url,name_title&video_id=eq.${videoId}`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) return res.status(response.status).json({ error: "Failed to fetch video" });
      const data = await response.json();
      if (!data || data.length === 0) return res.status(404).json({ error: "Video not found" });
      res.json(data[0]);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve video page with injected data
  app.get("/v/:videoId", async (req, res, next) => {
    try {
      const { videoId } = req.params;
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/iframe?select=m3u8_url,name_title&video_id=eq.${videoId}`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      let videoData = null;
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          videoData = data[0];
        }
      }

      // In development, we use the client/index.html template
      // In production, we'd use dist/public/index.html
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        // In dev, let server/vite.ts handle it to ensure preamble and transforms are correct
        return next();
      }

      const fs = await import("fs/promises");
      const htmlPath = path.resolve(process.cwd(), "dist/public/index.html");
      let html = await fs.readFile(htmlPath, "utf-8");

      if (videoData) {
        const script = `<script>window.__VIDEO_DATA__ = ${JSON.stringify(videoData)};</script>`;
        html = html.replace("<head>", `<head>${script}`);
      }

      res.send(html);
    } catch (error) {
      console.error("Error serving video page:", error);
      next(error);
    }
  });

  // Root route fallback for dev
  app.get("/", (req, res, next) => {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) return next(); // Let Vite handle it
    res.sendFile(path.resolve(process.cwd(), "dist/public/index.html"));
  });

  return httpServer;
}
