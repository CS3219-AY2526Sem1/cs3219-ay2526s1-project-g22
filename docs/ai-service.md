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
        AIService[AI Service<br/>Port: 6008]
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

    %% Client Connections
    UI -->|HTTPS| Gateway
    UI -->|WebSocket| SupabaseRT
    UI -->|HTTP| Piston

    %% Gateway Connections
    Gateway -->|HTTP| UserService
    Gateway -->|HTTP| QuestionService
    Gateway -->|HTTP| MatchingService
    Gateway -->|HTTP| CollabService
    Gateway -->|HTTP| AIService

    %% Service Connections
    UserService -->|Query| Supabase
    QuestionService -->|Query| MongoDB
    MatchingService -->|Queue| Redis
    CollabService -->|WebSocket| SupabaseRT

    %% AI Service External Call
    AIService -.->|Calls OpenRouter API| OpenRouter[(OpenRouter)]

    %% Styles
    style UI fill:#4CAF50,stroke:#333,stroke-width:1px
    style Gateway fill:#2196F3,stroke:#333,stroke-width:1px
    style UserService fill:#FF9800,stroke:#333,stroke-width:1px
    style QuestionService fill:#FF9800,stroke:#333,stroke-width:1px
    style MatchingService fill:#FF9800,stroke:#333,stroke-width:1px
    style CollabService fill:#FF9800,stroke:#333,stroke-width:1px
    style AIService fill:#9C27B0,color:#fff,stroke:#333,stroke-width:1px
    style MongoDB fill:#8BC34A,stroke:#333,stroke-width:1px
    style Supabase fill:#00C896,stroke:#333,stroke-width:1px
    style Redis fill:#E53935,stroke:#333,stroke-width:1px
    style SupabaseRT fill:#00BCD4,stroke:#333,stroke-width:1px
    style Piston fill:#607D8B,stroke:#333,stroke-width:1px
    style OpenRouter fill:#673AB7,color:#fff,stroke:#333,stroke-width:1px
