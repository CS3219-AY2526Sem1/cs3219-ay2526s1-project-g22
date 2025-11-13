<!-- AI Assistance Disclosure:
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
        MessagingService[Messaging Service<br/>Port: 6007]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>Question DB)]
        Supabase[(Supabase<br/>User & Auth + Chat DB)]
        Redis[(Redis<br/>Matching Queue)]
    end

    subgraph "Real-time Layer"
        SupabaseRT[Supabase Realtime<br/>WebSocket Channels]
    end

    subgraph "Code Execution"
        Piston[Piston API<br/>Code Runner]
    end

    %% Client Connections
    UI -->|HTTPS| Gateway
    UI -->|WebSocket| SupabaseRT
    UI -->|HTTP| Piston

    %% Gateway Connections
    Gateway -->|HTTP| UserService
    Gateway -->|HTTP| QuestionService
    Gateway -->|HTTP| MatchingService
    Gateway -->|HTTP| CollabService
    Gateway -->|HTTP| MessagingService

    %% Service Connections
    UserService -->|Query| Supabase
    QuestionService -->|Query| MongoDB
    MatchingService -->|Queue| Redis
    CollabService -->|WebSocket| SupabaseRT
    MessagingService -->|Store Message| Supabase

    %% Realtime / Trigger Flow
    Supabase -->|Trigger on Message Updates calls Realtime| SupabaseRT

    %% Styles
    style UI fill:#4CAF50,color:#fff,stroke:#333,stroke-width:1px
    style Gateway fill:#2196F3,color:#fff,stroke:#333,stroke-width:1px
    style UserService fill:#FF9800,color:#fff,stroke:#333,stroke-width:1px
    style QuestionService fill:#FF9800,color:#fff,stroke:#333,stroke-width:1px
    style MatchingService fill:#FF9800,color:#fff,stroke:#333,stroke-width:1px
    style CollabService fill:#FF9800,color:#fff,stroke:#333,stroke-width:1px
    style MessagingService fill:#FF5722,color:#fff,stroke:#333,stroke-width:1px
    style MongoDB fill:#8BC34A,color:#fff,stroke:#333,stroke-width:1px
    style Supabase fill:#00C896,color:#fff,stroke:#333,stroke-width:1px
    style Redis fill:#E53935,color:#fff,stroke:#333,stroke-width:1px
    style SupabaseRT fill:#00BCD4,color:#fff,stroke:#333,stroke-width:1px
    style Piston fill:#607D8B,color:#fff,stroke:#333,stroke-width:1px
