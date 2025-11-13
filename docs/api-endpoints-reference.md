<!-- AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, API design, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture, and verified that no design or documentation content was produced by AI. All narrative and API details are original work. -->
# PeerPrep API Endpoints Reference

Quick reference guide for all available API endpoints in the PeerPrep platform.

**Base URL (Development):** `http://localhost:8000`  
**Base URL (Production):** `https://peerprep-backend.ap-southeast-1.elasticbeanstalk.com`

---

## 🔐 Authentication

All endpoints marked with 🔒 require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 1️⃣ User Service

**Base Path:** `/api/user-service`

| Method | Endpoint    | Auth | Description              |
| ------ | ----------- | ---- | ------------------------ |
| POST   | `/v1/users` | 🔒   | Create user profile      |
| GET    | `/v1/users` | 🔒   | Get current user profile |
| PUT    | `/v1/users` | 🔒   | Update user profile      |

### Example: Get User Profile

```bash
curl -X GET "http://localhost:8000/api/user-service/v1/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

## 2️⃣ Question Service

**Base Path:** `/api/question-service`

| Method | Endpoint            | Auth | Description                 | Query Parameters                     |
| ------ | ------------------- | ---- | --------------------------- | ------------------------------------ |
| GET    | `/questions`        | ❌   | Get all questions or filter | `?difficulty=Easy&topics=algorithms` |
| GET    | `/questions/random` | ❌   | Get random question         | `?difficulty=Medium&topics=arrays`   |
| GET    | `/questions/topics` | ❌   | Get all available topics    | -                                    |
| GET    | `/questions/:id`    | ❌   | Get question by ID          | -                                    |
| POST   | `/questions/by-ids` | ❌   | Get questions by IDs array  | -                                    |

### Example: Get Random Medium Question

```bash
curl -X GET "http://localhost:8000/api/question-service/questions/random?difficulty=Medium"
```

**Response:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "questionId": "q123",
  "title": "Two Sum",
  "difficulty": "Medium",
  "content": "Given an array of integers...",
  "tags": ["algorithms", "arrays", "hash-table"]
}
```

### Example: Get Questions by Topics

```bash
curl -X GET "http://localhost:8000/api/question-service/questions?topics=algorithms,data-structures"
```

### Example: Get Multiple Questions by IDs

```bash
curl -X POST "http://localhost:8000/api/question-service/questions/by-ids" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["q123", "q456", "q789"]}'
```

---

## 3️⃣ Collaboration Service

**Base Path:** `/api/collaboration-service`

| Method | Endpoint                     | Auth | Description                     |
| ------ | ---------------------------- | ---- | ------------------------------- |
| POST   | `/sessions`                  | 🔒   | Create new coding session       |
| GET    | `/sessions/:id`              | ❌   | Get session by ID               |
| PATCH  | `/sessions/:id/snapshot`     | ❌   | Update code snapshot            |
| PATCH  | `/sessions/:id/complete`     | ❌   | Mark session as completed       |
| POST   | `/sessions/getUserSessions`  | 🔒   | Get all user sessions (history) |
| POST   | `/sessions/getActiveSession` | 🔒   | Get current active session      |

### Example: Create New Session

```bash
curl -X POST "http://localhost:8000/api/collaboration-service/sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewer_id": "550e8400-e29b-41d4-a716-446655440000",
    "interviewee_id": "550e8400-e29b-41d4-a716-446655440001",
    "question_id": "q123",
    "initial_code": "// Start coding here"
  }'
```

**Response:**

```json
{
  "id": "650e8400-e29b-41d4-a716-446655440000",
  "interviewer_id": "550e8400-e29b-41d4-a716-446655440000",
  "interviewee_id": "550e8400-e29b-41d4-a716-446655440001",
  "question_id": "q123",
  "current_code": "// Start coding here",
  "current_language": "javascript",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": null
}
```

### Example: Update Code Snapshot

```bash
curl -X PATCH "http://localhost:8000/api/collaboration-service/sessions/650e8400-e29b-41d4-a716-446655440000/snapshot" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function twoSum(nums, target) {\n  // implementation\n}",
    "language": "javascript"
  }'
```

### Example: Get User Session History

```bash
curl -X POST "http://localhost:8000/api/collaboration-service/sessions/getUserSessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4️⃣ Matching Service

**Base Path:** `/api/matching-service/matching`

| Method | Endpoint                        | Auth | Description                     |
| ------ | ------------------------------- | ---- | ------------------------------- |
| GET    | `/preferences/:userId`          | ❌   | Get user matching preferences   |
| POST   | `/preferences/:userId`          | ❌   | Set/update matching preferences |
| POST   | `/queue/:userId`                | ❌   | Add user to matching queue      |
| DELETE | `/queue/:userId`                | ❌   | Remove user from queue          |
| DELETE | `/matches/:matchId`             | ❌   | Clear all matches for match ID  |
| GET    | `/history/:userId`              | ❌   | Get user matching history       |
| POST   | `/proposals/:proposalId/accept` | 🔒   | Accept match proposal           |
| POST   | `/proposals/:proposalId/reject` | 🔒   | Reject match proposal           |

### Example: Set Matching Preferences

```bash
curl -X POST "http://localhost:8000/api/matching-service/matching/preferences/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["algorithms", "data-structures"],
    "difficulty": "medium"
  }'
```

### Example: Add to Matching Queue

```bash
curl -X POST "http://localhost:8000/api/matching-service/matching/queue/550e8400-e29b-41d4-a716-446655440000"
```

### Example: Accept Match Proposal

```bash
curl -X POST "http://localhost:8000/api/matching-service/matching/proposals/proposal123/accept" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5️⃣ Chat Service

**Base Path:** `/api/chat-service/sessions`

| Method | Endpoint                    | Auth | Description         | Query Parameters              |
| ------ | --------------------------- | ---- | ------------------- | ----------------------------- |
| GET    | `/:sessionId/chats`         | 🔒   | Get chat messages   | `?since=2024-01-15T10:00:00Z` |
| POST   | `/:sessionId/chats`         | 🔒   | Send chat message   | -                             |
| DELETE | `/:sessionId/chats/:chatId` | 🔒   | Delete chat message | -                             |

### Example: Get Chat Messages

```bash
curl -X GET "http://localhost:8000/api/chat-service/sessions/650e8400-e29b-41d4-a716-446655440000/chats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
[
  {
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "session_id": "650e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "How should we approach this problem?",
    "role": "user",
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

### Example: Send Chat Message

```bash
curl -X POST "http://localhost:8000/api/chat-service/sessions/650e8400-e29b-41d4-a716-446655440000/chats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Let'\''s start with a brute force approach",
    "role": "user"
  }'
```

### Example: Delete Message

```bash
curl -X DELETE "http://localhost:8000/api/chat-service/sessions/650e8400-e29b-41d4-a716-446655440000/chats/750e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6️⃣ AI Service

**Base Path:** `/api/ai-service/ai`

| Method | Endpoint | Auth | Description                         |
| ------ | -------- | ---- | ----------------------------------- |
| POST   | `/chat`  | 🔒   | Get AI coding assistance (DeepSeek) |

### Example: AI Chat Request

```bash
curl -X POST "http://localhost:8000/api/ai-service/ai/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful coding assistant."
      },
      {
        "role": "user",
        "content": "Explain the time complexity of binary search."
      }
    ]
  }'
```

**Response:**

```json
{
  "response": "Binary search has a time complexity of O(log n)...",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 128,
    "total_tokens": 173
  }
}
```

---

## 7️⃣ API Gateway

**Base Path:** `/`

| Method | Endpoint  | Auth | Description           |
| ------ | --------- | ---- | --------------------- |
| GET    | `/health` | ❌   | Health check endpoint |

### Example: Health Check

```bash
curl -X GET "http://localhost:8000/health"
```

**Response:**

```json
{
  "status": "ok"
}
```

---

## 📊 Service Summary

| Service               | Port | Endpoints | Auth Required |
| --------------------- | ---- | --------- | ------------- |
| User Service          | 6001 | 3         | ✅ All        |
| Question Service      | 6002 | 5         | ❌ None       |
| Collaboration Service | 6004 | 6         | 🔶 Some       |
| Matching Service      | 6006 | 8         | 🔶 Some       |
| Chat Service          | 6010 | 3         | ✅ All        |
| AI Service            | 6020 | 1         | ✅ All        |

**Total Endpoints:** 26

---

## 🌐 WebSocket Connections

The API Gateway supports WebSocket upgrades for real-time features:

---

## 📝 Response Status Codes

| Code | Meaning      | Common Causes                      |
| ---- | ------------ | ---------------------------------- |
| 200  | Success      | Request completed successfully     |
| 400  | Bad Request  | Invalid request body or parameters |
| 401  | Unauthorized | Missing or invalid JWT token       |
| 403  | Forbidden    | User lacks permission for resource |
| 404  | Not Found    | Resource doesn't exist             |
| 500  | Server Error | Internal service error             |

---
