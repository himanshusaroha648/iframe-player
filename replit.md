# Replit.md

## Overview

This is an embeddable HLS video player application built with React and Express. The application serves as a video streaming embed player that fetches video metadata from Supabase and plays HLS (HTTP Live Streaming) content. Users access videos via URLs in the format `/v/:videoId`, where the video data is retrieved from a Supabase database containing M3U8 stream URLs and video titles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Video Playback**: hls.js for HLS stream handling
- **Build Tool**: Vite with path aliases (`@/` for client/src, `@shared/` for shared)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **Development**: tsx for TypeScript execution
- **Build**: esbuild for production bundling, Vite for client

### Data Flow Pattern
1. Client requests `/v/:videoId`
2. Server can either:
   - Serve the SPA and let client fetch via `/api/video/:videoId`
   - Inject video data directly into the HTML response (SSR-like optimization)
3. Video player initializes hls.js with the M3U8 URL

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated to `./migrations` directory
- **Push Command**: `npm run db:push`

The `iframe` table schema contains:
- `id`: Primary key (bigint)
- `video_id`: Unique identifier for video lookups
- `m3u8_url`: HLS stream URL
- `name_title`: Video title
- `xnxx_url`: Source URL reference
- `created_at`: Timestamp

### Key Design Decisions
- **Shared Schema**: Types and schemas defined in `shared/` directory for use by both client and server
- **Direct Supabase Access**: Server proxies requests to Supabase REST API rather than using Drizzle for reads (likely for simplicity and Supabase's built-in features)
- **Embed-First Design**: No home page; application is designed to be embedded via iframe or direct video URLs

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Supabase**: Backend-as-a-service providing the database and REST API
  - URL: `https://ygzatbhatbafsqqehxzw.supabase.co`
  - Uses REST API with anon key for video data retrieval

### Third-Party Libraries
- **hls.js**: HLS video streaming support
- **@supabase/supabase-js**: Supabase client SDK (available but server uses REST API directly)
- **shadcn/ui**: Component library built on Radix UI primitives
- **TanStack Query**: Data fetching and caching
- **Drizzle ORM**: Database schema management and type generation

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_SUPABASE_URL`: Supabase project URL (client-side)
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key (client-side)

### Fonts
- Inter (body text)
- Outfit (display/headings)
- Google Fonts CDN for delivery