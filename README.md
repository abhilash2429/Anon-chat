# Anon Chat

A simple, secure way to chat with anyone. No logins, no tracking, no history. Just create a room and share the link.

Features:
- **Text Chat**: Real-time messaging.
- **Video**: Peer-to-peer video calls (WebRTC).
- **Secure**: Optional password protection for rooms.
- **Host Controls**: Kick everyone out and delete the room when you're done.

## How to run it

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-username/anon-chat.git
   cd anon-chat
   npm install
   ```

2. **Setup Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL in `supabase/schema.sql` in your project's SQL Editor.
   - Copy your Project URL and Anon Key.

3. **Env Vars**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Start**
   ```bash
   npm run dev
   ```

## Deploy

Works best on Vercel. Just import the repo and add your Supabase env vars.

**Note**: Video chat requires HTTPS (which Vercel gives you for free).
