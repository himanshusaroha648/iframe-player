import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";

// Use env vars — service role key bypasses RLS on server-side
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ygzatbhatbafsqqehxzw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || "";

async function fetchVideoFromSupabase(videoId: string) {
  const url = `${SUPABASE_URL}/rest/v1/iframe?select=m3u8_url,name_title,image,video_thumbnail&video_id=eq.${encodeURIComponent(videoId)}&limit=1`;

  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Supabase] ${res.status} — ${body}`);
    return null;
  }

  const data = await res.json();
  console.log(`[Supabase] video_id=${videoId} →`, data);
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API route to fetch video data from Supabase
  app.get("/api/video/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      if (!videoId) return res.status(400).json({ error: "Video ID is required" });

      const video = await fetchVideoFromSupabase(videoId);
      if (!video) return res.status(404).json({ error: "Video not found" });

      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Serve video page with injected data
  app.get("/v/:videoId", async (req, res, next) => {
    try {
      const { videoId } = req.params;

      // Use shared helper (reads SUPABASE_KEY from env)
      const videoData = await fetchVideoFromSupabase(videoId).catch(() => null);

      // In development, let Vite handle routing
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) return next();

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
