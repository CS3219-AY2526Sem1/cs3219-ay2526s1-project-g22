
<!-- AI Assistance Disclosure:
    Tool: GitHub Copilot
    Date: 2025-11-12
    Scope: Documentation in this file were generated with AI assistance. All architectural decisions, system design, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
    Author review: I reviewed all AI-generated content for technical accuracy. All narrative and technical details are original work. -->


# PeerPrep Documentation

This directory contains comprehensive documentation for the PeerPrep project.

## 📚 Documentation Files

### API Documentation

- **[API Endpoints Reference](./api-endpoints-reference.md)** - Quick reference guide with examples
- **[API Documentation (OpenAPI Spec)](./api-documentation.yaml)** - Complete OpenAPI 3.0 specification
- **[Interactive API Viewer](./api-documentation.html)** - Swagger UI (open in browser)

### Architecture & Design

- **[Architecture Diagrams](./architecture-diagrams.md)** - System architecture, deployment, and sequence diagrams

---

# API Documentation Overview

Complete API documentation for the PeerPrep microservices architecture.

## 📄 Files

- **`api-documentation.yaml`** - OpenAPI 3.0 specification for all microservices

## 🚀 Viewing the Documentation

You have several options to view the Swagger documentation:

### Option 1: Swagger Editor (Online)

1. Open [Swagger Editor](https://editor.swagger.io/)
2. Click **File > Import file**
3. Select `api-documentation.yaml`
4. The documentation will be rendered with an interactive interface

### Option 2: VS Code Extension

1. Install the [Swagger Viewer](https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer) extension
2. Open `api-documentation.yaml` in VS Code
3. Press `Shift+Alt+P` (Windows/Linux) or `Shift+Option+P` (Mac)
4. Select "Preview Swagger" from the command palette

### Option 3: Swagger UI (Local)

Run Swagger UI locally using Docker:

```bash
docker run -p 8080:8080 -e SWAGGER_JSON=/api-documentation.yaml -v $(pwd)/docs:/usr/share/nginx/html swaggerapi/swagger-ui
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 4: Redoc (Local)

For a cleaner, read-only view:

```bash
npx @redocly/cli preview-docs docs/api-documentation.yaml
```

## 📚 API Overview

### Services

| Service                   | Port | Base Path                      | Description                         |
| ------------------------- | ---- | ------------------------------ | ----------------------------------- |
| **API Gateway**           | 8000 | `/api/:service/*`              | Single entry point for all services |
| **User Service**          | 6001 | `/api/user-service/*`          | User profile management             |
| **Question Service**      | 6002 | `/api/question-service/*`      | Coding questions database           |
| **Collaboration Service** | 6004 | `/api/collaboration-service/*` | Real-time code sessions             |
| **Matching Service**      | 6006 | `/api/matching-service/*`      | User matching algorithm             |
| **Chat Service**          | 6010 | `/api/chat-service/*`          | Real-time chat messaging            |
| **AI Service**            | 6020 | `/api/ai-service/*`            | AI coding assistance (DeepSeek)     |

### Authentication

Most endpoints require JWT authentication via Supabase:

```http
Authorization: Bearer <your-jwt-token>
```

### Example Requests

#### Get Questions by Difficulty

```bash
curl -X GET "http://localhost:8000/api/question-service/questions?difficulty=Medium"
```

#### Create a Collaboration Session

```bash
curl -X POST "http://localhost:8000/api/collaboration-service/sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewee_id": "user-uuid",
    "interviewer_id": "user-uuid",
    "question_id": "question-id"
  }'
```

#### Send a Chat Message

```bash
curl -X POST "http://localhost:8000/api/chat-service/sessions/SESSION_ID/chats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how do I solve this problem?",
    "role": "user"
  }'
```

## 🛠️ Development

### Updating the Documentation

When you add new endpoints to the microservices:

1. Open `api-documentation.yaml`
2. Add the new endpoint under the appropriate service tag
3. Define request/response schemas in the `components` section
4. Test the updated spec using Swagger Editor

### Validation

Validate the OpenAPI spec:

```bash
npx @redocly/cli lint docs/api-documentation.yaml
```

### Generate Client SDKs

You can auto-generate client SDKs from the OpenAPI spec:

```bash
# TypeScript/JavaScript
npx @openapitools/openapi-generator-cli generate \
  -i docs/api-documentation.yaml \
  -g typescript-axios \
  -o ./frontend/src/api-client

# Python
npx @openapitools/openapi-generator-cli generate \
  -i docs/api-documentation.yaml \
  -g python \
  -o ./python-client
```

## 📋 API Endpoints Summary

### User Service (`/api/user-service/*`)

- `POST /v1/users` - Create user profile
- `GET /v1/users` - Get current user profile
- `PUT /v1/users` - Update user profile

### Question Service (`/api/question-service/*`)

- `GET /questions` - Get questions (with filters)
- `GET /questions/random` - Get random question
- `GET /questions/topics` - Get all topics
- `GET /questions/:id` - Get question by ID
- `POST /questions/by-ids` - Get questions by IDs array

### Collaboration Service (`/api/collaboration-service/*`)

- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get session by ID
- `PATCH /sessions/:id/snapshot` - Update code snapshot
- `PATCH /sessions/:id/complete` - Mark session complete
- `POST /sessions/getUserSessions` - Get all user sessions
- `POST /sessions/getActiveSession` - Get active session

### Matching Service (`/api/matching-service/*`)

- `GET /matching/preferences/:userId` - Get preferences
- `POST /matching/preferences/:userId` - Set preferences
- `POST /matching/queue/:userId` - Add to queue
- `DELETE /matching/queue/:userId` - Remove from queue
- `DELETE /matching/matches/:matchId` - Clear matches
- `GET /matching/history/:userId` - Get match history
- `POST /matching/proposals/:proposalId/accept` - Accept match
- `POST /matching/proposals/:proposalId/reject` - Reject match

### Chat Service (`/api/chat-service/*`)

- `GET /sessions/:sessionId/chats` - Get chat messages
- `POST /sessions/:sessionId/chats` - Send chat message
- `DELETE /sessions/:sessionId/chats/:chatId` - Delete message

### AI Service (`/api/ai-service/*`)

- `POST /ai/chat` - AI-powered chat assistance

### API Gateway

- `GET /health` - Health check

## 🔗 Links

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [ReDoc Documentation](https://redocly.com/redoc/)
- [OpenAPI Generator](https://openapi-generator.tech/)

## 📝 Notes

- All endpoints are accessed through the API Gateway at port 8000
- WebSocket connections are supported for real-time features (chat, collaboration)
- The API Gateway automatically routes requests to the appropriate microservice
- Environment-specific URLs:
  - **Development**: `http://localhost:8000`
  - **Production**: `https://peerprep-backend.ap-southeast-1.elasticbeanstalk.com`
