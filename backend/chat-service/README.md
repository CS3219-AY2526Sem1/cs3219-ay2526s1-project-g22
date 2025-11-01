# Chat Service

This service provides server-mediated chat functionality for interview sessions.

Setup

- Copy environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SECRET_KEY) into `.env` in this folder or set them in your environment.
- Install dependencies:
  ```bash
  cd backend/chat-service
  npm install
  ```

Run (dev):

```bash
npm run dev
```

API

- GET /sessions/:sessionId/chats?since=<ISO-timestamp>
- POST /sessions/:sessionId/chats { content, role?, metadata? }

Database migration SQL is in `db/001-create-chats.sql` — paste it into the Supabase SQL editor to create the `chats` table.
