
<!-- AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, sequence logic, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture and flows, and verified that no design or documentation content was produced by AI. All narrative and technical details are original work. -->

sequenceDiagram
  autonumber
  participant J as Joining Client (Browser A)
  participant S as Supabase Realtime (room channel)
  participant P as Peer (existing participant)
  participant DB as Backend (Sessions API / Postgres)

  %% Initial fetch HTTP
  J->>DB: GET /sessions/<sessionId> (initSession)
  DB-->>J: session { current_code?, current_language?, ... }
  alt no session current_code && questionSnippet && sessionLang
    J->>DB: persistSnapshot(sessionId, questionSnippet) (seed persistence)
    DB-->>J: 200 OK
  end

  %% Subscribe + request sync
  J->>S: channel.subscribe(room-<sessionId>) + channel.track()
  S-->>P: presence.join(payload for new client)
  S-->>J: SUBSCRIBED ack

  J->>S: broadcast 'yjs-request-state' { from: J.clientId }
  S-->>P: deliver 'yjs-request-state'
  P->>S: broadcast 'yjs-sync' { update, to: J.clientId }
  S-->>J: deliver 'yjs-sync'
  J->>J: apply Y.applyUpdate(update)

  %% Autosave starts after subscribe
  J->>DB: persistSnapshot(sessionId, ytext.toString()) [every 5s] (periodic autosave from each client)

  %% Proactive cursor/identity exchange
  P->>S: broadcast 'who-are-you' -> to:J
  P->>S: broadcast 'cursor-update' -> to:J (caret position)
  S-->>J: deliver who-are-you / cursor-update
  J->>S: broadcast 'i-am' (optional) / update UI

  %% Leaving
  P->>S: unsubscribe / disconnect -> presence.leave
  S-->>J: presence.leave payload
  J->>J: remove remote cursor clear peer header
  J->>J: dispatch setRemoteCursorsEffect(of(updated)) / setRemoteGutterEffect(...)
  J->>J: pushToast('User left the page')
  Note right of P: endSession() clears autosave interval no explicit persist on leave
