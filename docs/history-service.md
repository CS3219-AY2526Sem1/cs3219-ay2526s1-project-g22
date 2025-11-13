<!-- 
AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, system design, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture, and verified that no design or documentation content was produced by AI. All narrative and technical details are original work. -->

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
        HistoryService[History Service<br/>Port: 6005]
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
    Gateway -->|HTTP| HistoryService

    UserService -->|Query| Supabase
    QuestionService -->|Query| MongoDB
    MatchingService -->|Queue| Redis
    CollabService -->|WebSocket| SupabaseRT
    HistoryService -->|Query| Supabase

    UI -->|WebSocket| SupabaseRT
    UI -->|HTTP| Piston

    style UI fill:#4CAF50
    style Gateway fill:#2196F3
    style UserService fill:#FF9800
    style QuestionService fill:#FF9800
    style MatchingService fill:#FF9800
    style CollabService fill:#FF9800
    style HistoryService fill:#BFFF00