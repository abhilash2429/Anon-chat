# AnonChat - Anonymous Real-time Video & Text Chat

A Next.js 14 application for anonymous real-time communication using Socket.io and WebRTC.

## Features
- **Anonymous Entry**: No login required. Random user slugs generated per session.
- **Real-time Text Chat**: Instant messaging with Socket.io.
- **Video Chat**: Peer-to-peer video conferencing using WebRTC (Mesh topology).
- **Room System**: Create public rooms (Text-only or Video+Text).
- **Modern UI**: Built with Tailwind CSS and shadcn/ui (Dark mode default).

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Socket.io
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io (Signaling & Chat), WebRTC (Video)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```
*Note: Ensure you have `@radix-ui/react-scroll-area` installed if not already present.*
```bash
npm install @radix-ui/react-scroll-area
```

### 2. Supabase Setup
1. Create a new Supabase project.
2. Run the following SQL in the Supabase SQL Editor to create tables:

```sql
-- Create Rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('text', 'video')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  content text not null,
  sender_slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for messages (Optional, if using Supabase Realtime instead of Socket.io for some features, but we use Socket.io primarily)
```

3. Get your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings > API.
4. Create a `.env.local` file in the root directory and add them:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start chatting.

## Deployment
- Deploy to **Vercel**.
- Add environment variables in Vercel dashboard.
- **Important**: WebRTC requires HTTPS. Vercel provides this by default.

## Next Steps / Extensions
- **Room Passwords**: Add a `password` column to the `rooms` table and a prompt before joining.
- **File Sharing**: Use WebRTC Data Channels or Supabase Storage.
- **Turn Servers**: For production WebRTC reliability behind firewalls, configure TURN servers in `components/VideoGrid.tsx`.
