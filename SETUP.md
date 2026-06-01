# SyncWatch — Full Setup Guide

## Overview

```
Frontend → Vercel (Next.js)
Backend  → Railway (NestJS + Socket.IO)
Database → Supabase (PostgreSQL)
```

---

## Step 1 — Supabase (Database)

1. Go to https://supabase.com and sign up / log in.
2. Click **New Project**.
   - Name it `syncwatch`
   - Set a strong database password (save it)
   - Choose a region close to you
3. Wait for the project to spin up (~1 min).
4. Go to **Project Settings → Database**.
5. Under **Connection string → URI**, copy the string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres
   ```
6. Save this — it becomes your `DATABASE_URL`.

> Tables are created automatically on first backend startup (`synchronize: true` in TypeORM config).

---

## Step 2 — Backend on Railway

1. Go to https://railway.app and sign up / log in with GitHub.
2. Click **New Project → Deploy from GitHub repo**.
3. Select your repo (push the `syncwatch/backend` folder first — see Git section below).
4. Railway will detect it. Set **Root Directory** to `backend`.
5. Go to **Variables** tab and add:
   ```
   DATABASE_URL = postgresql://postgres:...  (from Supabase)
   FRONTEND_URL = https://your-vercel-app.vercel.app  (fill after Vercel deploy)
   PORT         = 3001
   ```
6. Deploy. Railway gives you a URL like `https://syncwatch-backend.up.railway.app`.
7. Save that URL.

---

## Step 3 — Frontend on Vercel

1. Go to https://vercel.com and sign up / log in with GitHub.
2. Click **Add New → Project**.
3. Import your repo. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://syncwatch-backend.up.railway.app
   NEXT_PUBLIC_WS_URL      = https://syncwatch-backend.up.railway.app
   ```
5. Click **Deploy**. Vercel gives you a URL like `https://syncwatch.vercel.app`.
6. **Go back to Railway** and update `FRONTEND_URL` to this Vercel URL.
7. Redeploy the Railway backend (trigger manually from Railway dashboard).

---

## Step 4 — Local Development (Windows)

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- Git

### Backend
```cmd
cd syncwatch\backend
copy .env.example .env
```
Edit `.env`:
```
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
FRONTEND_URL=http://localhost:3000
PORT=3001
```
Then:
```cmd
npm install
npm run start:dev
```
Backend runs on http://localhost:3001

### Frontend
```cmd
cd syncwatch\frontend
copy .env.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```
Then:
```cmd
npm install
npm run dev
```
Frontend runs on http://localhost:3000

---

## Step 5 — Push to GitHub

```cmd
cd syncwatch
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/syncwatch.git
git push -u origin main
```

Then connect this repo to Railway (backend) and Vercel (frontend) as described above.

---

## How it works

1. User A visits the site, enters their name, clicks **Create Room**.
2. A UUID room is created. User A gets a URL like `/room/uuid-here`.
3. User A shares the URL with User B.
4. User B opens the URL, enters their name, and joins.
5. If a 3rd person tries, they are blocked with "Room is full".
6. Either user loads media (YouTube URL, Google Drive URL, or local file).
7. Play/pause/seek events sync in real time via WebSocket.
8. Chat and reactions are live and persisted to Supabase.

---

## Notes

- **YouTube**: Full sync (play/pause/seek) via IFrame API.
- **Google Drive**: Embed via iframe. Sync is manual (use chat to coordinate). File must be "Anyone with link can view."
- **Local files**: Both users load the same file locally. Only playback state is synced, not the file itself.
- **Drift correction**: Every 5 seconds the client pings the server for the authoritative timestamp. If drift > 0.5s, it corrects silently.
- **Reconnection**: Socket.IO auto-reconnects on network drop. Room state is re-sent on rejoin.
