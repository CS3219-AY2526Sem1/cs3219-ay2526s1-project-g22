<!-- 
AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, system design, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture, and verified that no design or documentation content was produced by AI. All narrative and technical details are original work. -->

---
config:
  theme: base
  look: classic
---
flowchart TD
    subgraph Browser["Frontend (Browser Tab)"]
        direction TB
        subgraph Realtime["Supabase Realtime (broadcasts, presence)"]
            SR["Realtime Pub/Sub channels"]
        end
        CM["CodeMirror Editor (EditorView, decorations)"]
        YDOC["Yjs (Y.Doc / Y.Text, y-collab plugin)"]
        UC["Local Cursor & Decorations (remote carets)"]
        CM --> YDOC
        CM --> UC
        YDOC -. autosave / language persist .-> APIP
    end
    Peer1["Peer Tab 1 (CodeMirror + Yjs)"] --> SR
    Peer2["Peer Tab 2 (CodeMirror + Yjs)"] --> SR
    SR -->|"broadcast yjs-update / cursor-update / language-change"| CM
    subgraph BackendAPI["Backend API / App"]
        direction TB
        APIP["persistSnapshot POST (/sessions/:id)"]
        APIGW["API Gateway"]
        SessionsSvc["Sessions Persistence Endpoint"]
    end
    subgraph Postgres["Supabase Postgres"]
        DB["sessions table"]
    end
    APIP -->|forward payload| APIGW
    APIGW -->|forward request| SessionsSvc
    SessionsSvc -->|update sessions table| DB
    DB -->|"Optional Realtime events"| SR
