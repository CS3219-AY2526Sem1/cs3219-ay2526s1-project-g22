<!-- 
AI Assistance Disclosure:
Tool: GitHub Copilot
Date: 2025-11-12
Scope: Diagrams in this file were generated with AI assistance. All architectural decisions, sequence logic, and documentation content were authored and reviewed by the project team; only diagram syntax/structure was produced by Copilot.
Author review: I reviewed all AI-generated diagrams for technical accuracy, ensured they matched the intended architecture and flows, and verified that no design or documentation content was produced by AI. All narrative and technical details are original work. -->

sequenceDiagram
  autonumber
  participant J as Joining Client (Browser A)
  participant S as Supabase Realtime (room channel)
  participant P as Peer (existing participant)
  participant O as Originator (Browser X)
  participant DB as Backend (Sessions API / Postgres)

  %% Initial fetch (HTTP)
  J->>DB: GET /sessions/<sessionId> (initSession)
  DB-->>J: session { current_code?, current_language?, ... }
  alt no session.current_code && questionSnippet && sessionLang
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
  note left of J: snapshotIntervalRef.current set
  loop every 5s
    J->>DB: persistSnapshot(sessionId, ytext.toString()) (periodic autosave)
    DB-->>J: 200 OK (best-effort)
  end

  %% Proactive cursor/identity exchange
  P->>S: broadcast 'who-are-you' -> to:J
  P->>S: broadcast 'cursor-update' -> to:J (caret position)
  S-->>J: deliver who-are-you / cursor-update
  J->>S: broadcast 'i-am' (optional) / update UI

  %% LANGUAGE NEGOTIATION (originator O proposes a language)
  O->>S: broadcast 'language-proposal' { language, from: O.clientId, proposalId, ts }
  S-->>P: deliver 'language-proposal'
  S-->>J: deliver 'language-proposal', all peers receive

  alt Simultaneous proposals (tie)
    %% Another peer concurrently proposed too (or P had pending)
    P->>S: broadcast 'language-proposal' { language, from: P.clientId, proposalId: theirs, ts }
    S-->>O: deliver theirs
    O->>O: compare proposalId (theirs vs ours, lexical)
    alt theirs < ours
      O->>S: broadcast 'language-cancel' { from: O.clientId, language: O.lang, proposalId: O.proposalId }
      S-->>P: deliver 'language-cancel' (their proposal wins)
      P->>P: show incoming proposal (user decision)
    else ours < theirs
      O->>S: broadcast 'language-response' { to: P.clientId, from: O.clientId, language, accept:false, proposalId: theirs }
      S-->>P: deliver auto-reject (our proposal wins)
    end
  else Normal: peers decide independently
    %% Peer decision branch
    alt Peer accepts
      P->>S: broadcast 'language-response' { to: O.clientId, from: P.clientId, language, accept:true, proposalId }
      S-->>O: deliver 'language-response'
      O->>O: apply language locally (setSelectedLanguage)
      O->>O: insert snippet into Yjs (ydoc.transact -> ytext.delete/insert)
      O->>DB: persistSnapshot(sessionId, /* code? optional */, language)  %% persist authoritative language
      DB-->>O: 200 OK
      O->>S: broadcast 'language-change' { language }
      S-->>P: deliver 'language-change'
      S-->>J: deliver 'language-change'
      P->>P: setSelectedLanguage(language) (UI update)
    else Peer rejects
      P->>S: broadcast 'language-response' { to: O.clientId, from: P.clientId, language, accept:false, proposalId }
      S-->>O: deliver 'language-response'
      O->>O: revert UI to prevLanguageRef pushToast("X rejected the language change")
    end
  end

  %% Originator timeout: no responses within TTL
  alt No responses within TTL (e.g., 10s)
    O->>O: pendingProposalRef cleared (timeout)
    O->>S: broadcast 'language-cancel' { from: O.clientId, language, proposalId } (optional)
    S-->>P: deliver 'language-cancel'
    P->>P: clear incoming prompt if present
  end

  %% Leaving (peer disconnects)
  P->>S: unsubscribe / disconnect -> presence.leave
  S-->>J: presence.leave payload
  J->>J: remove remote cursor for leftId, clear peer header if displayed
  J->>J: dispatch setRemoteCursorsEffect.of(updated) / setRemoteGutterEffect.of(updated)
  J->>J: pushToast('User left the page')
  note right of P: endSession() clears autosave interval, no explicit persist on leave 