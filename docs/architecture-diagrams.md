<!-- AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, system design, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture, and verified that no design or documentation content was produced by AI. All narrative and technical details are original work. -->

# PeerPrep Architecture Diagrams - Milestone 2

## Table of Contents

1. [Overall System Architecture](#1-overall-system-architecture)
2. [User Request Flow Diagram](#2-user-request-flow-diagram)
3. [Question Service Architecture](#3-question-service-architecture)
4. [Matching Service Architecture](#4-matching-service-architecture)
5. [Collaboration Service Architecture](#5-collaboration-service-architecture)
6. [Database Architecture](#6-database-architecture)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Sequence Diagrams](#9-sequence-diagrams)

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js Frontend<br/>Vercel Deployed]
    end

    subgraph "API Gateway Layer"
        Gateway[API Gateway Service<br/>Port: 8000]
    end

    subgraph "Microservices Layer"
        UserService[User Service<br/>Port: 6001]
        QuestionService[Question Service<br/>Port: 6002]
        MatchingService[Matching Service<br/>Port: 6006]
        CollabService[Collaboration Service<br/>Port: 6004]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>Question DB)]
        Supabase[(Supabase<br/>User & Auth)]
        Redis[(Redis<br/>Matching Queue)]
    end

    subgraph "Real-time Layer"
        SupabaseRT[Supabase Realtime<br/>WebSocket]
    end

    subgraph "Code Execution"
        Piston[Piston API<br/>Code Runner]
    end

    UI -->|HTTPS| Gateway
    Gateway -->|HTTP| UserService
    Gateway -->|HTTP| QuestionService
    Gateway -->|HTTP| MatchingService
    Gateway -->|HTTP| CollabService

    UserService -->|Query| Supabase
    QuestionService -->|Query| MongoDB
    MatchingService -->|Queue| Redis
    CollabService -->|WebSocket| SupabaseRT

    UI -->|WebSocket| SupabaseRT
    UI -->|HTTP| Piston

    style UI fill:#4CAF50
    style Gateway fill:#2196F3
    style UserService fill:#FF9800
    style QuestionService fill:#FF9800
    style MatchingService fill:#FF9800
    style CollabService fill:#FF9800
```

---

## 2. Collaboration Flow Diagram

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Gateway as API Gateway
    participant Service as Microservice
    participant Domain as Domain Layer
    participant DB as Database

    Client->>Gateway: 1. HTTP Request<br/>(e.g., GET /api/collaboration-service/sessions/123)
    Gateway->>Gateway: 2. Route Resolution<br/>(Match /collaboration-service/* pattern)
    Gateway->>Service: 3. Forward to Collaboration Service<br/>(GET /sessions/123)
    Service->>Domain: 4. Invoke Collaboration Domain<br/>(getSessionById)
    Domain->>DB: 5. Database Query
    DB-->>Domain: 6. Return session Data
    Domain-->>Service: 7. Return Domain Object
    Service-->>Gateway: 8. HTTP Response (200 OK)
    Gateway-->>Client: 9. Forward Response

    Note over Client,DB: Typical request flow through microservices
```

---

## 3. Question Service Architecture

```mermaid
graph TB
    subgraph "Question Service"
        QController[Question Controller<br/>REST Endpoints]
        QDomain[Question Domain Layer]
        QRepo[Question Repository]

        QController -->|Uses| QDomain
        QDomain -->|CRUD Operations| QRepo
    end

    subgraph "MongoDB Schema"
        QuestionDoc[Question Document<br/>- questionId: string<br/>- title: string<br/>- content: string<br/>- difficulty: enum<br/>- tags: array<br/>- codeSnippets: array<br/>- testCases: array]
    end

    QRepo -->|Query| QuestionDoc

    subgraph "API Endpoints"
        E1[GET /questions<br/>Filter by difficulty & topics]
        E2[GET /questions/:id<br/>Get specific question]
        E3[GET /questions/random<br/>Get random question]
    end

    E1 -.->|Handled by| QController
    E2 -.->|Handled by| QController
    E3 -.->|Handled by| QController

    style QuestionDoc fill:#4DB33D
```

**Database Choice Justification:**

- **MongoDB** chosen for flexible schema to store arrays (tags, codeSnippets, testCases)
- Allows nested objects for language-specific code snippets
- Easy querying with filters (difficulty, tags)
- Horizontal scaling capabilities for large question banks

---

## 4. Matching Service Architecture

```mermaid
graph TB
    subgraph "Matching Service"
        MController[Matching Controller]
        MManager[Match Manager]
        QueueManager[Queue Manager]
        AlgoEngine[Matching Algorithm]
    end

    subgraph "Redis Queue"
        WaitingQueue[(Waiting Queue<br/>User preferences stored)]
    end

    subgraph "Matching Flow"
        User1[User A<br/>Difficulty: Medium<br/>Topics: Array]
        User2[User B<br/>Difficulty: Medium<br/>Topics: Array]
        Match[Match Found!<br/>Create Session]
    end

    User1 -->|1. Request Match| MController
    User2 -->|1. Request Match| MController
    MController -->|2. Add to Queue| QueueManager
    QueueManager -->|3. Store| WaitingQueue
    QueueManager -->|4. Trigger| AlgoEngine
    AlgoEngine -->|5. Find Matching Preferences| WaitingQueue
    AlgoEngine -->|6. Match Found| MManager
    MManager -->|7. Create Session| Match
    Match -->|8. Notify via WebSocket| User1
    Match -->|8. Notify via WebSocket| User2

    style Match fill:#4CAF50
```

**Matching Algorithm:**

```mermaid
flowchart TD
    Start([User Clicks Find Match])
    AddQueue[Add User to Redis Queue<br/>with Preferences]
    CheckQueue{Any Users<br/>in Queue?}
    MatchCriteria{Preferences<br/>Match?}
    CreateRoom[Create Collaboration Room<br/>Assign Random Question]
    Notify[Notify Both Users<br/>Redirect to Room]
    Wait[Keep Waiting<br/>Timeout: 30s]
    Timeout{Timeout<br/>Reached?}
    Cancel[Remove from Queue<br/>Notify User]

    Start --> AddQueue
    AddQueue --> CheckQueue
    CheckQueue -->|Yes| MatchCriteria
    CheckQueue -->|No| Wait
    MatchCriteria -->|Match Found| CreateRoom
    MatchCriteria -->|No Match| Wait
    CreateRoom --> Notify
    Wait --> Timeout
    Timeout -->|Yes| Cancel
    Timeout -->|No| CheckQueue

    style CreateRoom fill:#4CAF50
    style Cancel fill:#f44336
```

**Edge Cases Handled:**

- No matches available → Timeout after 30s
- Simultaneous requests → Redis atomic operations
- User disconnects → Remove from queue
- Duplicate requests → Check existing queue entry

---

## 5. Collaboration Service Architecture

```mermaid
graph TB
    subgraph "Frontend Clients"
        Client1[User A Browser]
        Client2[User B Browser]
    end

    subgraph "Collaboration Service"
        CController[Collaboration Controller]
        SessionMgr[Session Manager]
        CodeSync[Code Sync Handler]
    end

    subgraph "Supabase Realtime"
        Channel[Realtime Channel]
        Presence[Presence Tracking]
        Broadcast[Broadcast Events]
    end

    subgraph "Storage"
        SupaDB[(Supabase DB<br/>Session Storage)]
    end

    Client1 -->|WebSocket| Channel
    Client2 -->|WebSocket| Channel
    Channel -->|Presence Events| Presence
    Channel -->|Code Updates| Broadcast

    CController -->|Manage| SessionMgr
    SessionMgr -->|Store| SupaDB
    CodeSync -->|Listen| Channel
    CodeSync -->|Sync| Broadcast

    Broadcast -->|Real-time Updates| Client1
    Broadcast -->|Real-time Updates| Client2

    style Channel fill:#3ECF8E
```

**Real-time Collaboration Flow:**

```mermaid
sequenceDiagram
    participant U1 as User A
    participant Channel as Supabase Channel
    participant U2 as User B

    U1->>Channel: Join room-123
    U2->>Channel: Join room-123
    Channel->>U1: Presence: User B joined
    Channel->>U2: Presence: User A joined

    U1->>U1: Types code
    U1->>Channel: Broadcast: code_update
    Channel->>U2: Receive: code_update
    U2->>U2: Apply code changes

    U2->>U2: Types code
    U2->>Channel: Broadcast: code_update
    Channel->>U1: Receive: code_update
    U1->>U1: Apply code changes

    Note over U1,U2: Real-time synchronization via WebSocket
```

**Technology Stack:**

- **Supabase Realtime** (WebSocket-based)
- **Presence API** for user tracking
- **Broadcast API** for code synchronization
- **CodeMirror** for collaborative editing

---

## 6. Database Architecture

```mermaid
graph TB
    subgraph "Supabase PostgreSQL"
        Users[Users Table<br/>- id: uuid<br/>- email: string<br/>- username: string<br/>- name: string<br/>- created_at: timestamp]

        Sessions[Sessions Table<br/>- id: uuid<br/>- user1_id: uuid<br/>- user2_id: uuid<br/>- question_id: string<br/>- current_code: text<br/>- status: enum<br/>- created_at: timestamp]

        Users -->|1:N| Sessions
    end

    subgraph "MongoDB"
        Questions["Questions Collection<br/>- questionId: string<br/>- title: string<br/>- content: html<br/>- difficulty: string<br/>- tags: array<br/>- codeSnippets: array<br/>- testCases: array"]
    end

    subgraph "Redis"
        MatchQueue[Match Queue<br/>Key: waiting-users<br/>Value: JSON<br/>TTL: 30s]
    end

    Sessions -.->|References| Questions

    style Users fill:#3ECF8E
    style Sessions fill:#3ECF8E
    style Questions fill:#4DB33D
    style MatchQueue fill:#DC382D
```

---

## 7. CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source Control"
        GitHub[GitHub Repository]
    end

    subgraph "CI Pipeline - Backend"
        Trigger1[Push to Branch]
        Build1[Build Services<br/>npm ci]
        Test1[Run Tests<br/>Jest]
        Docker1[Build Docker Images]
    end

    subgraph "CI Pipeline - Frontend"
        Trigger2[Push to Branch]
        Test2[Run Tests]
        Deploy[Deploy to Vercel]
    end

    subgraph "CD Pipeline - Backend"
        Push[Push Docker Images<br/>to AWS ECR]
        Deploy2[Deploy to AWS<br/>Elastic Beanstalk]
        Health[Health Checks<br/>& Monitoring]
    end

    GitHub -->|Webhook| Trigger1
    GitHub -->|Webhook| Trigger2

    Trigger1 --> Build1 --> Test1 --> Docker1
    Trigger2 --> Test2 --> Deploy

    Docker1 --> Push
    Push --> Deploy2
    Deploy2 --> Health

    style Deploy fill:#4CAF50
    style Deploy2 fill:#4CAF50
    style Health fill:#4CAF50
```

**Current CI/CD Status:**

- ✅ **Backend**: Build + Test automation (User & Question services)
- ✅ **Frontend**: Automated deployment to Vercel
- 🔄 **Planned**: Docker image push to AWS ECR
- 🔄 **Planned**: Automated deployment to AWS Elastic Beanstalk

---

## 8. Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment - AWS"
        subgraph "Elastic Beanstalk"
            EB1[API Gateway<br/>Docker Container<br/>Port: 8000]
            EB2[User Service<br/>Docker Container<br/>Port: 6001]
            EB3[Question Service<br/>Docker Container<br/>Port: 6002]
            EB4[Matching Service<br/>Docker Container<br/>Port: 6006]
            EB5[Collaboration Service<br/>Docker Container<br/>Port: 6004]
            EB6[History Service<br/>Docker Container<br/>Port: 6005]
            EB7[Chat Service<br/>Docker Container<br/>Port: 6010]
            EB8[AI Service<br/>Docker Container<br/>Port: 6020]
        end

        subgraph "Load Balancer"
            ALB[Application Load Balancer<br/>HTTPS: 443]
        end

        subgraph "Container Registry"
            ECR[Amazon ECR<br/>Docker Images]
        end
    end

    subgraph "External Services"
        Vercel[Vercel<br/>Next.js Frontend]
        MongoDB[MongoDB Atlas<br/>Question Database]
        Supabase[Supabase Cloud<br/>]
        Redis[Redis Cloud<br/>Cache Layer]
        OpenRouter[OpenRouter API<br/>DeepSeek Model]
        Piston[Piston API<br/>Code Execution Engine]
    end

    Users[End Users] -->|HTTPS| Vercel
    Vercel -->|API Calls| ALB
    Vercel -->|Direct API Call| Piston
    ALB --> EB1

    EB1 --> EB2
    EB1 --> EB3
    EB1 --> EB4
    EB1 --> EB5
    EB1 --> EB6
    EB1 -->|WebSocket Upgrade| EB7
    EB1 --> EB8

    ECR -.->|Pull Images| EB1
    ECR -.->|Pull Images| EB2
    ECR -.->|Pull Images| EB3
    ECR -.->|Pull Images| EB4
    ECR -.->|Pull Images| EB5
    ECR -.->|Pull Images| EB6
    ECR -.->|Pull Images| EB7
    ECR -.->|Pull Images| EB8

    EB2 -->|SQL Queries| Supabase
    EB3 -->|NoSQL Queries| MongoDB
    EB4 -->|Cache Operations| Redis
    EB5 -->|WebSocket| Supabase
    EB6 -->|SQL Queries| Supabase
    EB7 -->|Cache Operations| Redis
    EB8 -->|HTTPS API Call| OpenRouter
    EB8 -->|Fetch Context| Supabase

    style Vercel fill:#4CAF50,stroke:#333,color:#000
    style ALB fill:#FF9800,stroke:#333,color:#000
    style EB1 fill:#2196F3,stroke:#333,color:#fff
    style EB2 fill:#9E9E9E,stroke:#333,color:#fff
    style EB3 fill:#9E9E9E,stroke:#333,color:#fff
    style EB4 fill:#9E9E9E,stroke:#333,color:#fff
    style EB5 fill:#9E9E9E,stroke:#333,color:#fff
    style EB6 fill:#9E9E9E,stroke:#333,color:#fff
    style EB7 fill:#9C27B0,stroke:#333,color:#fff
    style EB8 fill:#E91E63,stroke:#333,color:#fff
    style MongoDB fill:#47A248,stroke:#333,color:#fff
    style Supabase fill:#3ECF8E,stroke:#333,color:#000
    style Redis fill:#DC382D,stroke:#333,color:#fff
    style OpenRouter fill:#00A67E,stroke:#333,color:#fff
    style Piston fill:#9B59B6,stroke:#333,color:#fff
```

**Why AWS Elastic Beanstalk?**

1. **Simplified Container Orchestration**: Automatically handles Docker deployment
2. **Auto-scaling**: Scales based on traffic
3. **Load Balancing**: Built-in ALB for distributing requests
4. **Easy Rollback**: Version management for deployments
5. **Cost-Effective**: Pay only for resources used
6. **Integration**: Works seamlessly with ECR, CloudWatch
7. **Monitoring**: Built-in health monitoring

---

## 9. Sequence Diagrams

### 9.1 Complete User Matching Flow

```mermaid
sequenceDiagram
    participant U1 as User A
    participant UI as Frontend
    participant Gateway as API Gateway
    participant Match as Matching Service
    participant Redis as Redis Queue
    participant Collab as Collaboration Service
    participant Question as Question Service
    participant U2 as User B

    U1->>UI: Click "Find Match"
    UI->>Gateway: POST /matching/find
    Gateway->>Match: Forward request
    Match->>Redis: Add User A to queue
    Redis-->>Match: Queued
    Match-->>UI: Waiting for match

    U2->>UI: Click "Find Match"
    UI->>Gateway: POST /matching/find
    Gateway->>Match: Forward request
    Match->>Redis: Add User B to queue
    Redis->>Match: Check for matches
    Match->>Match: Algorithm finds match

    Match->>Question: GET /questions/random
    Question-->>Match: Return question

    Match->>Collab: POST /sessions/create
    Collab-->>Match: Session ID

    Match->>UI: Notify User A (WebSocket)
    Match->>UI: Notify User B (WebSocket)
    UI->>U1: Redirect to room/{sessionId}
    UI->>U2: Redirect to room/{sessionId}
```

### 9.2 Real-time Code Collaboration

```mermaid
sequenceDiagram
    participant U1 as User A Browser
    participant Channel as Supabase Channel
    participant DB as Supabase DB
    participant U2 as User B Browser

    U1->>Channel: Subscribe to room-123
    U2->>Channel: Subscribe to room-123

    Channel->>U1: Presence: User B online
    Channel->>U2: Presence: User A online

    loop Code Editing
        U1->>U1: Type code
        U1->>Channel: Broadcast code_update
        Channel->>U2: Receive code_update
        U2->>U2: Update editor

        Note over Channel,DB: Periodic snapshot every 5s
        Channel->>DB: Save code snapshot
    end

    U1->>Channel: Execute code
    U1->>Piston: Run code
    Piston-->>U1: Execution results
    U1->>Channel: Broadcast results
    Channel->>U2: Show results
```

### 9.3 Question Retrieval Flow

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant Gateway as API Gateway
    participant QService as Question Service
    participant MongoDB as MongoDB

    UI->>Gateway: GET /api/question-service/questions/random?<br/>difficulty=Medium&topics=Array
    Gateway->>QService: GET /questions/random
    QService->>MongoDB: db.questions.aggregate([<br/>{$match: {difficulty: "Medium", tags: "Array"}},<br/>{$sample: {size: 1}}<br/>])
    MongoDB-->>QService: Return random question
    QService-->>Gateway: Question object
    Gateway-->>UI: Question data
    UI->>UI: Display question in room
```

---

## Summary of Architecture Decisions

### 1. **Question Service**

- **Database**: MongoDB for flexible schema
- **Integration**: REST API via API Gateway
- **Scaling**: Horizontal scaling with MongoDB sharding

### 2. **Matching Service**

- **Algorithm**: Queue-based with preference matching
- **Edge Cases**: Timeout, duplicates, disconnections
- **Integration**: Redis queue + WebSocket notifications

### 3. **Collaboration Service**

- **Technology**: Supabase Realtime (WebSocket)
- **Real-time**: Code synchronization, presence tracking
- **Scaling**: Supabase handles WebSocket connections

### 4. **Service Containerization**

- **Approach**: Docker + AWS Elastic Beanstalk
- **CI/CD**: GitHub Actions → Build → Test → Push → Deploy
- **Monitoring**: CloudWatch logs, health checks

### 5. **Nice-to-Have Features**

- Code execution (Piston API)
- Language-specific code templates
- Execution history tracking
- Real-time collaboration indicators

---

## How to Use These Diagrams

1. **Copy Mermaid code** to https://mermaid.live
2. **Export as PNG/SVG** for your presentation
3. **Include in documentation** (GitHub renders Mermaid natively)
4. **Use for mentor meetings** to explain architecture
