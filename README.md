# ChatFlow — Realtime Web Messaging Application

ChatFlow is a full-featured, WhatsApp-style real-time web messaging platform built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth with Google OAuth, PostgreSQL, Row Level Security, Realtime, and Storage).

---

## 🌟 Key Features

* **Google Authentication**: Seamless OAuth login via Supabase Auth.
* **Real-time Messaging**: Instant message delivery powered by Supabase Realtime channels.
* **Direct & Group Conversations**: Create 1-on-1 chats or multi-member group conversations with admin controls.
* **Rich Media Sharing**: Image previews with fullscreen lightbox viewer, document attachments, and downloads.
* **Message Interaction**: Multi-line auto-resizing text composer, emoji picker, reply preview, message editing, soft deletion, and emoji reactions (❤️, 😂, 👍, 😮, 😢, 🔥).
* **Presence & Typing Indicators**: Online/offline indicators and real-time typing signals.
* **Read Receipts & Badges**: Sent/Delivered/Read checkmark status and unread badges.
* **Pin, Archive, & Mute**: Per-user conversation management.
* **Search & Filters**: Search conversations and users by full name, username, or message text.
* **Profile & Settings**: Custom avatars, bio, status text, light/dark/system theme customization, notification toggles.
* **Database Row Level Security (RLS)**: Enforced RLS policies preventing unauthorized access to messages or conversations.

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
npm install
npm run dev
```

The application will launch on `http://localhost:3000`.

---

## ⚙️ Supabase Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Name your project `ChatFlow` and set a secure database password.

### 2. Run Database Migrations

1. Navigate to the **SQL Editor** tab in your Supabase Dashboard.
2. Open the included migration script: `supabase/migrations/00001_initial_schema.sql`.
3. Paste the contents into the SQL Editor and click **Run**.
4. This creates all tables (`profiles`, `conversations`, `conversation_members`, `messages`, `message_reactions`, `user_presence`, `user_settings`), indexes, RLS policies, atomic functions, and storage buckets (`avatars`, `chat-media`, `documents`).

---

## 🔐 Google OAuth Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Configure the **OAuth Consent Screen** (User type: External).
4. Go to **Credentials** &gt; **Create Credentials** &gt; **OAuth Client ID**.
5. Select **Web Application**.
6. Under **Authorized JavaScript Origins**, add:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co`
   - `http://localhost:3000`
7. Under **Authorized Redirect URIs**, add:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
8. Copy the generated **Client ID** and **Client Secret**.
9. In Supabase Dashboard, navigate to **Authentication** &gt; **Providers** &gt; **Google**.
10. Toggle **Enable Google provider**, paste your Client ID and Client Secret, and click **Save**.

---

## 🔑 Environment Variables

Create a `.env.local` file in your root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🧪 Testing

```bash
# Run TypeScript compilation check
npm run lint

# Build for production
npm run build
```
