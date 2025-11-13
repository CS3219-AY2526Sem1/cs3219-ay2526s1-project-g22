/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and changed behvaiour of a couple fo test cases for clarity
*/
"use client";

import { useUser } from "@/contexts/user-context";
import axiosInstance from "@/lib/axios";
import { createClient } from "@/lib/supabase/supabase-client";
import { Question } from "@/queries/use-get-questions";
import { languageMap } from "@/utils/language-config";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { indentOnInput, indentUnit } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap, Decoration, WidgetType, GutterMarker, gutter } from "@codemirror/view";
import { EditorState, StateEffect, StateField, RangeSet } from "@codemirror/state";
import { DecorationSet } from "@codemirror/view";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import CodeMirror from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RealtimeContext from "../contexts/realtime-context";
import CodeEditorHeader from "./CodeEditorHeader";
import CodeEditorLanguageSelectionAndRunButton from "./CodeEditorLanguageSelectionAndRunButton";
import CodeEditorSubmissionResults from "./CodeEditorSubmissionResults";

// --- YJS imports ---
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

// Remote cursor info stored per client id
interface RemoteCursor {
  anchor: number;
  head: number;
  userName?: string;
  color?: string;
  ts?: number;
}

interface SubmissionResult {
  language: string;
  [key: string]: unknown;
}

const baseApiUrl = "/api/collaboration-service";

type Props = {
  sessionId: string;
  question?: Question;
  showHeader?: boolean;
};

type BroadcastPayload = { payload?: Record<string, unknown> };

export default function CodeEditor({
  sessionId,
  question,
  showHeader = true,
}: Props) {
  const router = useRouter();
  const [sessionEnded, setSessionEnded] = useState(false);
  const { user } = useUser();
  const userId = user?.id;

  // Start with no language selected. The editor will be non-editable
  // until a language is chosen by a participant.
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    undefined
  );
  // proposal / confirmation UI state
  const [incomingProposal, setIncomingProposal] = useState<{
    from?: string;
    language: string;
    proposalId?: string;
  } | null>(null);
  // keep a ref copy so realtime callbacks (which close over values) can
  // reliably inspect/clear the current incoming proposal
  const incomingProposalRef = useRef<{
    from?: string;
    language: string;
    proposalId?: string;
  } | null>(null);
  const [proposalPending, setProposalPending] = useState<{
    language: string;
    timeoutId: number | null;
  } | null>(null);
  // simple toast system
  const [toasts, setToasts] = useState<
    { id: string; message: string; ttl?: number }[]
  >([]);

  const pushToast = useCallback((message: string, ttl = 5000) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast = { id, message, ttl };
    setToasts((t) => [...t, toast]);
    if (ttl && ttl > 0) {
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, ttl);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const prevLanguageRef = useRef<string | undefined | null>(null);
  // track pending proposal in a ref so realtime callbacks see the up-to-date value
  // includes proposalId to allow deterministic tie-breaking for simultaneous
  // proposals
  const pendingProposalRef = useRef<{
    language: string;
    timeoutId: number | null;
    proposalId: string;
    ts: number;
  } | null>(null);
  // countdown for originator's pending proposal (ms remaining)
  const [proposalCountdownMs, setProposalCountdownMs] = useState<number | null>(null);
  // stable client id used in realtime messages when `userId` may be undefined
  // We'll prefer the authenticated user id when available. When not, we will
  // attempt to use the Supabase realtime connection/client id (set after
  // subscribing). Only fall back to a local random id if no supabase id is
  // discoverable.
  const clientIdRef = useRef<string>(userId || "");
  const [submissionHistory, setSubmissionHistory] = useState<
    SubmissionResult[]
  >([]);
  // initial code to show in the editor (from session or question snippet)
  const [initialCode, setInitialCode] = useState<string | undefined>(undefined);

  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Remote cursors map: clientId -> { anchor, head, userName?, color, ts }
  const remoteCursorsRef = useRef<Record<string, RemoteCursor>>({});
  // NOTE: peer info caching via ref was removed in favor of explicit React
  // state (`peerUsernameState` / `peerIdDisplayed`) which drives header
  // re-renders. This avoids stale header display when peers leave.
  // Visible peer display state: keep in React state so header updates when
  // peers join/leave. We also remember which peer id is currently shown.
  const [peerUsernameState, setPeerUsernameState] = useState<string | undefined>(
    undefined
  );
  const [peerIdDisplayed, setPeerIdDisplayed] = useState<string | undefined>(
    undefined
  );
  // refs to keep latest values accessible from realtime handlers which close
  // over the original joinRealtimeChannel callback (avoids stale closures)
  const peerIdDisplayedRef = useRef<string | undefined>(undefined);
  const peerUsernameRef = useRef<string | undefined>(undefined);
  // Track pending leave events to debounce quick reconnects (e.g., page refresh)
  // Maps clientId -> { timeoutId, userName, timestamp }
  const pendingLeavesRef = useRef<Record<string, { timeoutId: NodeJS.Timeout; userName: string; ts: number }>>({});

  const getPeerName = (id?: string, fallback?: string) => {
    if (!id) return fallback;
    // Use refs to avoid stale closure values when called from realtime handlers
    if (peerIdDisplayedRef.current && id === peerIdDisplayedRef.current && peerUsernameRef.current)
      return peerUsernameRef.current;
    return fallback;
  };

  // keep refs in sync with state so event handlers can read latest values
  useEffect(() => {
    peerIdDisplayedRef.current = peerIdDisplayed;
    peerUsernameRef.current = peerUsernameState;
  }, [peerIdDisplayed, peerUsernameState]);


  const pickColor = (id: string) => {
    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
    return colors[Math.abs(h) % colors.length];
  };

  // StateEffect & StateField used to update editor decorations for remote cursors
  const setRemoteCursorsEffect = useMemo(() => StateEffect.define<Record<string, RemoteCursor>>(), []);
  const remoteCursorsField = useMemo(() =>
    StateField.define<DecorationSet>({
      create() {
        return Decoration.none;
      },
      update(decos, tr) {
        // First, map decorations through document changes to adjust positions
        if (tr.docChanged) {
          try {
            decos = decos.map(tr.changes);
          } catch (err) {
            // If mapping fails, clear decorations and rebuild from current state
            decos = Decoration.none;
          }
          
          // Also update the underlying cursor positions in remoteCursorsRef
          // so they stay in sync with the document changes
          const updatedCursors: Record<string, RemoteCursor> = {};
          const docLength = tr.state.doc.length;
          Object.keys(remoteCursorsRef.current || {}).forEach((cid) => {
            const c = remoteCursorsRef.current[cid];
            if (c && typeof c.head === "number") {
              try {
                // Clamp positions to valid range before mapping to prevent out-of-range errors
                const clampedHead = Math.max(0, Math.min(c.head, docLength));
                const clampedAnchor = typeof c.anchor === "number" 
                  ? Math.max(0, Math.min(c.anchor, docLength)) 
                  : clampedHead;
                
                // Map cursor positions through the document changes
                const newHead = tr.changes.mapPos(clampedHead, 1);
                const newAnchor = tr.changes.mapPos(clampedAnchor, 1);
                
                updatedCursors[cid] = {
                  ...c,
                  head: Math.max(0, Math.min(newHead, docLength)),
                  anchor: Math.max(0, Math.min(newAnchor, docLength)),
                };
              } catch (err) {
                // If mapping fails, clamp to document bounds
                updatedCursors[cid] = {
                  ...c,
                  head: Math.max(0, Math.min(c.head, docLength)),
                  anchor: typeof c.anchor === "number" 
                    ? Math.max(0, Math.min(c.anchor, docLength)) 
                    : Math.max(0, Math.min(c.head, docLength)),
                };
              }
            }
          });
          remoteCursorsRef.current = updatedCursors;
        }
        
        for (const e of tr.effects) {
          if (e.is(setRemoteCursorsEffect)) {
            const cursors = e.value ?? {};
            // build decorations from cursors and current doc
            type DecRange = ReturnType<Decoration["range"]>;
            const builder: DecRange[] = [];
            const doc = tr.state.doc;
            Object.keys(cursors).forEach((cid) => {
              const c = cursors[cid];
              if (!c || typeof c.head !== "number") return;
              const head = Math.max(0, Math.min(doc.length, c.head));
              const anchor = Math.max(0, Math.min(doc.length, c.anchor ?? c.head));
              // selection
              if (anchor !== head) {
                const from = Math.min(anchor, head);
                const to = Math.max(anchor, head);
                builder.push(Decoration.mark({
                  attributes: { style: `background: ${c.color}33;` },
                }).range(from, to));
              }
              // caret widget
              class CursorWidget extends WidgetType {
                color: string;
                baseLabel: string;
                isSelf: boolean;
                constructor(color: string, label: string, isSelf = false) {
                  super();
                  this.color = color;
                  this.baseLabel = label;
                  this.isSelf = isSelf;
                }
                toDOM() {
                  const el = document.createElement("span");
                  el.className = "cm-remote-caret";
                  // Make caret slightly thicker and a bit taller so it's visible
                  el.style.borderLeft = `2px solid ${this.color}`;
                  el.style.marginLeft = "-2px";
                  el.style.height = "1.05em";
                  el.style.display = "inline-block";
                  el.style.verticalAlign = "text-bottom";
                  // subtle glow to help visibility on dark backgrounds
                  el.style.boxShadow = `0 0 4px ${this.color}66`;
                  // Use title attribute so hovering the caret shows the user name
                  const label = this.baseLabel || "";
                  el.title = label + (this.isSelf ? " (You)" : "");
                  // Ensure the caret element receives pointer events so the
                  // browser tooltip (title) appears on hover.
                  el.style.pointerEvents = "auto";
                  return el;
                }
                // Allow DOM events on the widget so hover/title works in all browsers
                ignoreEvent() { return false; }
              }
              const caret = Decoration.widget({ widget: new CursorWidget(String(c.color || ""), String(c.userName || cid), cid === clientIdRef.current), side: 1 }).range(head);
              builder.push(caret);
            });
            // convert array to Decoration.set
            const set = Decoration.set(builder as readonly DecRange[], true);
            decos = set;
          }
        }
        return decos;
      },
      provide: f => EditorView.decorations.from(f),
    }), [setRemoteCursorsEffect]
  );
  // Gutter markers: show a small colored dot next to the line number for remote cursors
  const setRemoteGutterEffect = useMemo(() => StateEffect.define<Record<string, RemoteCursor>>(), []);
  const remoteGutterField = useMemo(() =>
    StateField.define<RangeSet<GutterMarker>>({
      create() {
        // empty RangeSet
        return RangeSet.empty as unknown as RangeSet<GutterMarker>;
      },
      update(markers, tr) {
        // map markers through document changes first
        if (tr.docChanged) {
          try {
            markers = markers.map(tr.changes);
          } catch (err) {
            // If mapping fails, clear markers and rebuild from current state
            markers = RangeSet.empty as unknown as RangeSet<GutterMarker>;
          }
        }
        
        for (const e of tr.effects) {
          if (e.is(setRemoteGutterEffect)) {
            const cursors = e.value ?? {};
            const doc = tr.state.doc;
            type GutterRange = ReturnType<GutterMarker["range"]>;
            const byLine: GutterRange[] = [];
            Object.keys(cursors).forEach((cid) => {
              const c = cursors[cid];
              if (!c || typeof c.head !== "number") return;
              const head = Math.max(0, Math.min(doc.length, c.head));
              try {
                const line = tr.state.doc.lineAt(head);
                class RemoteGutterMarker extends GutterMarker {
                  color: string;
                  baseLabel: string;
                  isSelf: boolean;
                  constructor(color: string, label: string, isSelf = false) {
                    super();
                    this.color = color;
                    this.baseLabel = label;
                    this.isSelf = isSelf;
                    this.elementClass = "cm-remote-gutter-marker";
                  }
                  toDOM(view?: EditorView) {
                    const el = document.createElement("div");
                    el.className = "cm-remote-gutter-dot";
                    const label = this.baseLabel || "";
                    const displayLabel = label + (this.isSelf ? " (You)" : "");
                    el.title = displayLabel;
                    // expose username and color as data attributes for tooltip handlers
                    el.dataset.username = displayLabel;
                    el.dataset.color = this.color;
                    el.style.width = "10px";
                    el.style.height = "10px";
                    el.style.borderRadius = "50%";
                    el.style.background = this.color;
                    // remove horizontal margin so tooltip sits flush next to the gutter dot
                    el.style.margin = "4px 0";
                    el.style.boxShadow = `0 0 6px ${this.color}66`;
                    return el;
                  }
                }
                const marker = new RemoteGutterMarker(String(c.color || ""), String(c.userName || cid), cid === clientIdRef.current);
                byLine.push(marker.range(line.from));
              } catch (err) {
                // Skip this marker if lineAt fails
              }
            });
            markers = RangeSet.of(byLine as readonly GutterRange[], true) as unknown as RangeSet<GutterMarker>;
          }
        }
        return markers;
      },
    }), [setRemoteGutterEffect]
  );
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const getSnippetForLanguage = (displayLanguage: string): string | null => {
    try {
      const cfg = languageMap[displayLanguage as keyof typeof languageMap];
      const apiLang = cfg?.apiLang || displayLanguage;
      const snippets = question?.codeSnippets;
      if (!snippets || snippets.length === 0) return null;
      const found = snippets.find(
        (s: { lang?: string; language?: string; type?: string }) =>
          [s.lang, s.language, s.type].some(
            (v) =>
              !!v && String(v).toLowerCase() === String(apiLang).toLowerCase()
          )
      );

      if (!found) return null;
      return (
        (found.code as string) ||
        (found.content as string) ||
        (found.snippet as string) ||
        ""
      );
    } catch (err) {
      return null;
    }
  };

  // yjs setup
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const ytextRef = useRef<Y.Text>(ydocRef.current.getText("codemirror"));
  // whether we've received any remote Yjs state (update or sync) for this join
  const stateReceivedRef = useRef<boolean>(false);
  // timeout id used to schedule a fallback initial insert when no remote state arrives
  const initialInsertTimeoutRef = useRef<number | null>(null);

  // keep ref in sync with state so realtime handlers can read latest value
  useEffect(() => {
    incomingProposalRef.current = incomingProposal;
  }, [incomingProposal]);

  // If the originator refreshes while a proposal is pending, attempt to
  // notify peers and remember in sessionStorage so the initiator sees a
  // cancellation notice after reload.
  useEffect(() => {
    const storageKey = `pp-cancelled-${sessionId}`;

    const onBeforeUnload = () => {
      const pending = pendingProposalRef.current;
      if (pending && channelRef.current) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "language-cancel",
            payload: {
              from: clientIdRef.current,
              language: pending.language,
              proposalId: pending.proposalId,
            },
          });
        } catch (err) {
          // ignore
        }
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({ language: pending.language, ts: Date.now() })
          );
        } catch (err) {
          // ignore
        }
      }
      // If we have an incoming proposal (we are the requested) then send an
      // automatic rejection to the originator so they aren't left waiting.
      const incoming = incomingProposalRef.current;
      if (incoming && incoming.from && channelRef.current) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "language-response",
            payload: {
              to: incoming.from,
              from: clientIdRef.current,
              language: incoming.language,
              accept: false,
              proposalId: incoming.proposalId,
            },
          });
        } catch (err) {
          // ignore
        }
        try {
          sessionStorage.setItem(
            `pp-rejected-${sessionId}`,
            JSON.stringify({
              language: incoming.language,
              from: incoming.from,
              ts: Date.now(),
            })
          );
        } catch (err) {
          // ignore
        }
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sessionId]);

  // Update the countdown while a proposal is pending. TTL must match
  // the timeout used in `requestLanguageChange` (10s).
  useEffect(() => {
    const TTL = 10000;
    let iv: number | null = null;
    const update = () => {
      const p = pendingProposalRef.current;
      if (!p) {
        setProposalCountdownMs(null);
        return;
      }
      const rem = Math.max(0, TTL - (Date.now() - (p.ts || 0)));
      setProposalCountdownMs(rem);
      if (rem <= 0 && iv) {
        clearInterval(iv);
      }
    };

    if (proposalPending) {
      update();
      iv = window.setInterval(update, 200) as unknown as number;
    } else {
      setProposalCountdownMs(null);
    }

    return () => {
      if (iv) clearInterval(iv);
      setProposalCountdownMs(null);
    };
  }, [proposalPending]);

  // On mount, check if we previously cancelled due to a refresh and show
  // a transient notice to the initiator.
  useEffect(() => {
    const storageKey = `pp-cancelled-${sessionId}`;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw || "{}");
        const lang = parsed?.language;
        pushToast(
          `Your pending language change to ${lang || "<unknown>"
          } was cancelled due to a refresh`
        );
        sessionStorage.removeItem(storageKey);
      }
    } catch (err) {
      // ignore
    }
  }, [sessionId]);

  // If we previously auto-rejected by refresh (the requested refreshed while
  // a proposal was incoming) show a transient notice on reload.
  useEffect(() => {
    const storageKey = `pp-rejected-${sessionId}`;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw || "{}");
        const lang = parsed?.language;
        pushToast(
          `You refreshed while a proposal was pending; the proposal for ${lang || "<unknown>"
          } was auto-rejected.`
        );
        sessionStorage.removeItem(storageKey);
      }
    } catch (err) {
      // ignore
    }
  }, [sessionId]);

  const executeCode = async () => {
    const langConfig =
      languageMap[selectedLanguage as keyof typeof languageMap];
    if (!langConfig) {
      alert("Language not supported for execution yet!");
      return;
    }
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: langConfig.apiLang,
          code: ytextRef.current.toString(),
        }),
      });
      const data = await res.json();
      setSubmissionHistory((h) => [
        ...h,
        { language: selectedLanguage, ...data },
      ]);
    } catch (error) {
      console.error("Execution error:", error);
    }
  };

  // endSession optionally sends a broadcast to notify other participant.
  // When called as a reaction to a received broadcast, call with sendBroadcast=false
  // to avoid re-broadcast loops.
  const endSession = useCallback(
    (sendBroadcast = true) => {
      const channel = channelRef.current;
      if (sendBroadcast && channel) {
        try {
          channel.send({
            type: "broadcast",
            event: "exit_session",
            payload: { type: "end_session", from: userId, ts: Date.now() },
          });
        } catch (err) {
          // ignore send errors
          // console.debug("endSession broadcast failed", err);
        }
      }

      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch (err) {
          // ignore
        }
        channelRef.current = null;
      }
      setSessionEnded(true);
      setTimeout(() => router.push("/"), 1000);
    },
    [userId, router]
  );

  const joinRealtimeChannel = useCallback(
    async (initialCode: string) => {
      const channel = supabase.channel(`room-${sessionId}`, {
        config: { presence: { key: userId } },
      });

      // apply yjs updates
      channel.on("broadcast", { event: "yjs-update" }, (payload) => {
        // mark that we received remote state and cancel any fallback insert
        stateReceivedRef.current = true;
        if (initialInsertTimeoutRef.current) {
          clearTimeout(initialInsertTimeoutRef.current);
          initialInsertTimeoutRef.current = null;
        }
        const update = new Uint8Array(payload.payload.update);
        Y.applyUpdate(ydocRef.current, update);
      });

      // incoming cursor updates from peers
      channel.on(
        "broadcast",
        { event: "cursor-update" },
        (payload: { payload?: Record<string, unknown> }) => {
          try {
            const raw = payload.payload ?? {};
            const pl = (raw.payload as Record<string, unknown> | undefined) ?? raw;
            const cid = (pl.clientId as string) || (pl.from as string) || undefined;
            const sel = (pl.selection as { anchor: number; head: number } | undefined) || pl;
            const userMeta = (pl.user as Record<string, unknown>) || {};
            if (!cid || cid === clientIdRef.current) return;
            
            // Get current document length to clamp cursor positions
            const docLength = editorViewRef.current?.state?.doc?.length ?? 0;
            const rawHead = typeof sel.head === "number" ? sel.head : 0;
            const rawAnchor = typeof sel.anchor === "number" ? sel.anchor : rawHead;
            
            // Clamp positions to valid document range
            const clampedHead = Math.max(0, Math.min(rawHead, docLength));
            const clampedAnchor = Math.max(0, Math.min(rawAnchor, docLength));
            
            const userName = String((userMeta as Record<string, unknown>)['name'] ?? cid);
            
            const map = {
              ...(remoteCursorsRef.current || {}),
              [cid]: {
                anchor: clampedAnchor,
                head: clampedHead,
                userName,
                color: pickColor(cid),
                ts: typeof pl.ts === "number" ? pl.ts : Date.now(),
              } as RemoteCursor,
            } as Record<string, RemoteCursor>;
            remoteCursorsRef.current = map;
            
            // If we don't currently have a peer displayed in the header, or if
            // this cursor update is from the currently displayed peer, update
            // the header state to ensure the username is shown
            if (!peerIdDisplayedRef.current || peerIdDisplayedRef.current === cid) {
              setPeerIdDisplayed(cid);
              peerIdDisplayedRef.current = cid;
              setPeerUsernameState(userName);
              peerUsernameRef.current = userName;
            }
            
            // update decorations and gutter markers in the editor if available
            try {
              editorViewRef.current?.dispatch({
                effects: [
                  setRemoteCursorsEffect.of(map),
                  setRemoteGutterEffect.of(map),
                ],
              });
            } catch (err) {
              // ignore
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // incoming language proposal from another client
      channel.on(
        "broadcast",
        { event: "language-proposal" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const lang = pl.language as string | undefined;
            const from = pl.from as string | undefined;
            const proposalId = pl.proposalId as string | undefined;
            const ts = typeof pl.ts === "number" ? pl.ts : Date.now();
            if (!lang || !from || from === clientIdRef.current || !proposalId)
              return;

            // If we have an outgoing pending proposal, this is a simultaneous
            // proposal situation. Resolve deterministically by comparing
            // proposalId strings (lexical order); the smaller id wins. If we
            // lose the tie, cancel our outgoing; if we win, auto-reject the
            // incoming proposal so the UX remains deterministic.
            const pending = pendingProposalRef.current;
            if (pending) {
              try {
                const theirs = proposalId;
                const ours = pending.proposalId;
                if (theirs < ours) {
                  // Their proposal wins. Cancel our pending proposal and
                  // present the incoming one for user decision.
                  try {
                    channelRef.current?.send({
                      type: "broadcast",
                      event: "language-cancel",
                      payload: {
                        from: clientIdRef.current,
                        language: pending.language,
                        proposalId: pending.proposalId,
                      },
                    });
                  } catch (err) {
                    // ignore
                  }
                  if (pending.timeoutId) clearTimeout(pending.timeoutId);
                  pendingProposalRef.current = null;
                  setProposalPending(null);
                  if (prevLanguageRef.current) {
                    setSelectedLanguage(prevLanguageRef.current);
                    prevLanguageRef.current = null;
                  }
                  // show incoming proposal to local user
                  const incoming = { from, language: lang, proposalId };
                  incomingProposalRef.current = incoming;
                  setIncomingProposal(incoming);
                  return;
                } else {
                  // Our proposal wins: auto-reject their proposal so they
                  // will process the rejection deterministically.
                  try {
                    channelRef.current?.send({
                      type: "broadcast",
                      event: "language-response",
                      payload: {
                        to: from,
                        from: clientIdRef.current,
                        language: lang,
                        accept: false,
                        proposalId,
                      },
                    });
                  } catch (err) {
                    // ignore
                  }
                  // don't show incoming prompt (we've auto-rejected)
                  return;
                }
              } catch (err) {
                // if tie-break logic fails, fall back to showing incoming
              }
            }

            // show incoming proposal to local user
            const incoming = { from, language: lang, proposalId };
            incomingProposalRef.current = incoming;
            setIncomingProposal(incoming);
          } catch (err) {
            // ignore
          }
        }
      );

      // react to language-change broadcasts (update UI language selection)
      channel.on(
        "broadcast",
        { event: "language-change" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const lang = pl.language as string | undefined;
            if (lang && typeof lang === "string") {
              // update selected language in the UI; do NOT persist here
              // (originator already persisted and possibly updated Yjs doc)
              setSelectedLanguage(lang);
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // originator cancelled a previously-sent proposal
      channel.on(
        "broadcast",
        { event: "language-cancel" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const from = pl.from as string | undefined;
            const lang = pl.language as string | undefined;
            const proposalId = pl.proposalId as string | undefined;
            if (!from || from === clientIdRef.current) return;
            // if we have an incoming proposal from that originator matching
            // the proposalId, clear it
            const cur = incomingProposalRef.current;
            if (cur && cur.from === from) {
              incomingProposalRef.current = null;
              setIncomingProposal(null);
              pushToast(
                `${getPeerName(from, "User")} cancelled language change to ${lang || "<unknown>"}`
              );
            }
            // If the cancel targets our outgoing pending proposal, clear it
            const pending = pendingProposalRef.current;
            if (pending && proposalId && pending.proposalId === proposalId) {
              if (pending.timeoutId) clearTimeout(pending.timeoutId);
              pendingProposalRef.current = null;
              setProposalPending(null);
              if (prevLanguageRef.current) {
                setSelectedLanguage(prevLanguageRef.current);
                prevLanguageRef.current = null;
              }
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // language response to proposals (only relevant to originator)
      channel.on(
        "broadcast",
        { event: "language-response" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const to = pl.to as string | undefined;
            const accept = pl.accept as boolean | undefined;
            const lang = pl.language as string | undefined;
            const from = pl.from as string | undefined;
            const proposalId = pl.proposalId as string | undefined;
            // only handle responses addressed to this client
            if (!to || to !== clientIdRef.current) return;
            // if originator and waiting on proposal, process first response
            const pending = pendingProposalRef.current;
            if (pending && lang && typeof accept === "boolean") {
              // make sure this response matches the proposal we sent
              if (proposalId && pending.proposalId !== proposalId) {
                // ignore responses to other proposals
                return;
              }
              // clear pending timeout
              if (pending.timeoutId) {
                clearTimeout(pending.timeoutId);
              }
              pendingProposalRef.current = null;
              setProposalPending(null);
              if (accept) {
                // apply language change (originator applies and broadcasts)
                try {
                  setSelectedLanguage(lang);
                  const snippet = getSnippetForLanguage(lang);
                  if (snippet !== null) {
                    ydocRef.current.transact(() => {
                      ytextRef.current.delete(0, ytextRef.current.length);
                      ytextRef.current.insert(0, snippet);
                    });
                  }
                } catch (err) {
                  // ignore
                }
                // persist authoritative language
                persistSnapshot(baseApiUrl, sessionId, undefined, lang)
                  .catch(() => void 0)
                  .finally(() => {
                    // notify peers about accepted change
                    try {
                      channelRef.current?.send({
                        type: "broadcast",
                        event: "language-change",
                        payload: { language: lang },
                      });
                    } catch (err) {
                      // ignore
                    }
                  });
              } else {
                // someone rejected; notify originator UI (no-op for now)
                if (prevLanguageRef.current) {
                  setSelectedLanguage(prevLanguageRef.current);
                  prevLanguageRef.current = null;
                }
                // show rejection notice briefly
                pushToast(
                  `${getPeerName(from, "User")} rejected the language change to ${lang}`
                );
                // could show a toast here in future
              }
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // send a vector update of the full document state to the new joiner
      channel.on("broadcast", { event: "yjs-request-state" }, (payload) => {
        const { from } = payload.payload;
        if (!from || from === clientIdRef.current) return;
        const update = Y.encodeStateAsUpdate(ydocRef.current);
        channel.send({
          type: "broadcast",
          event: "yjs-sync",
          payload: { update: Array.from(update), to: from },
        });
      });

      // --- Apply full Yjs state received from peer ---
      channel.on("broadcast", { event: "yjs-sync" }, (payload) => {
        const { to, update } = payload.payload;
        if (to === clientIdRef.current) {
          // mark that we received remote state and cancel any fallback insert
          stateReceivedRef.current = true;
          if (initialInsertTimeoutRef.current) {
            clearTimeout(initialInsertTimeoutRef.current);
            initialInsertTimeoutRef.current = null;
          }
          Y.applyUpdate(ydocRef.current, new Uint8Array(update));
          console.info("Applied full Yjs document state from peer");
        }
      });

      channel.on(
        "broadcast",
        { event: "exit_session" },
        (payload: { payload?: Record<string, unknown> }) => {
          try {
            const raw = payload.payload ?? {};
            const candidate =
              (raw.payload as Record<string, unknown> | undefined) ?? raw;

            if (candidate?.type === "end_session") {
              const from = candidate.from as string | undefined;
              if (!from || from !== userId) endSession(false);
            }
          } catch (err) {
            console.warn(
              "realtime: failed to handle exit_session payload",
              err
            );
          }
        }
      );

      // --- Presence handlers ---
      channel.on("presence", { event: "leave" }, (payload: Record<string, unknown>) => {
        try {
          console.log("realtime: presence.leave payload:", payload);
          const p = payload as Record<string, unknown>;
          // common shapes: payload.key or payload.presence or payload.old
          const leftId = (p['key'] as string) || ((p['presence'] as Record<string, unknown>)?.['key'] as string) || ((p['old'] as Record<string, unknown>)?.['key'] as string) || (((p['old'] as Record<string, unknown>)?.['new'] as Record<string, unknown>)?.['key'] as string);
          // try to find a friendly name in presence meta as fallback
          const metaName =
            (((p['presence'] as Record<string, unknown>)?.['meta'] as Record<string, unknown>)?.['name'] as string) ||
            ((((p['presence'] as Record<string, unknown>)?.['meta'] as Record<string, unknown>)?.['user'] as Record<string, unknown>)?.['name'] as string) ||
            (((p['old'] as Record<string, unknown>)?.['meta'] as Record<string, unknown>)?.['name'] as string) ||
            ((((p['old'] as Record<string, unknown>)?.['meta'] as Record<string, unknown>)?.['user'] as Record<string, unknown>)?.['name'] as string);
          // Prefer known display name sources in order:
          // 1) if the leaving id matches the currently-displayed peer, use that name
          // 2) any cached remote cursor entry for that client id (contains userName)
          // 3) presence meta
          // 4) literal 'User'
          const cursorEntry = (remoteCursorsRef.current || {})[leftId || ""];
          const name = (leftId && peerIdDisplayedRef.current && leftId === peerIdDisplayedRef.current && peerUsernameRef.current)
            || (cursorEntry && cursorEntry.userName)
            || metaName
            || "User";
          console.log("realtime: peer left presence key:", leftId);
          // don't show a toast for our own disconnect
          if (leftId && String(leftId) === String(clientIdRef.current)) return;

          // Debounce the leave event: delay processing for 2 seconds to allow
          // for quick reconnects (e.g., page refresh). If the peer rejoins
          // within this window, we'll cancel the leave processing.
          if (leftId) {
            // Clear any existing timeout for this peer
            if (pendingLeavesRef.current[leftId]) {
              clearTimeout(pendingLeavesRef.current[leftId].timeoutId);
            }
            
            // Schedule the leave processing
            const timeoutId = setTimeout(() => {
              // Process the actual leave after debounce period
              // If the peer that left is the one currently shown in the header,
              // clear the displayed peer so the header no longer shows a departed user.
              if (peerIdDisplayedRef.current && String(leftId) === String(peerIdDisplayedRef.current)) {
                setPeerIdDisplayed(undefined);
                peerIdDisplayedRef.current = undefined;
                setPeerUsernameState(undefined);
                peerUsernameRef.current = undefined;
              }

              // Remove remote cursor for the leaving peer so decorations/gutter
              // markers disappear from the editor.
              try {
                if (remoteCursorsRef.current && remoteCursorsRef.current[leftId]) {
                  const updated = { ...(remoteCursorsRef.current || {}) };
                  delete updated[leftId];
                  remoteCursorsRef.current = updated;
                  // dispatch editor update to refresh decorations and gutter
                  try {
                    editorViewRef.current?.dispatch({
                      effects: [
                        setRemoteCursorsEffect.of(updated),
                        setRemoteGutterEffect.of(updated),
                      ],
                    });
                  } catch (err) {
                    // ignore dispatch errors
                  }
                }
              } catch (err) {
                // ignore
              }

              try {
                pushToast(`${name} left the page`);
              } catch (err) {
                // ignore
              }
              
              // Clean up the pending leave entry
              delete pendingLeavesRef.current[leftId];
            }, 2000); // 2 second debounce window
            
            pendingLeavesRef.current[leftId] = { timeoutId, userName: name, ts: Date.now() };
          }
        } catch (err) {
          console.warn("realtime: presence.leave handler error", err);
        }
      });

      // presence.join: someone (possibly us) joined — query the peer for their user info
      channel.on("presence", { event: "join" }, (payload: Record<string, unknown>) => {
        try {
          console.log("realtime: presence.join payload:", payload);
          const p = payload as Record<string, unknown>;
          const joinedId = (p['key'] as string) || ((p['presence'] as Record<string, unknown>)?.['key'] as string) || (((p['new'] as Record<string, unknown>)?.['key']) as string) || ((((p['new'] as Record<string, unknown>)?.['old'] as Record<string, unknown>)?.['key']) as string);
          if (!joinedId) return;
          // ignore our own join
          if (String(joinedId) === String(clientIdRef.current)) return;
          
          // Cancel any pending leave event for this peer (they reconnected quickly)
          if (pendingLeavesRef.current[joinedId]) {
            clearTimeout(pendingLeavesRef.current[joinedId].timeoutId);
            delete pendingLeavesRef.current[joinedId];
            console.log("realtime: cancelled pending leave for", joinedId, "(quick reconnect)");
          }

          // send a direct broadcast asking the peer to identify themselves
          try {
            channel.send({
              type: "broadcast",
              event: "who-are-you",
              payload: { to: joinedId, from: clientIdRef.current },
            });
          } catch (err) {
            // ignore
          }
          // Also proactively send our current cursor/selection to the newly
          // joined client so they immediately see our caret when they enter.
          // This fixes the case where a reentering participant doesn't get
          // existing peers' cursor positions until those peers move their
          // cursors.
          try {
            const view = editorViewRef.current;
            if (view) {
              const sel = view.state.selection.main;
              const payload = {
                clientId: clientIdRef.current,
                selection: { anchor: sel.anchor, head: sel.head },
                user: { name: user && user.name },
                ts: Date.now(),
                to: joinedId,
              };
              channel.send({ type: "broadcast", event: "cursor-update", payload });
            }
          } catch (err) {
            // ignore
          }
        } catch (err) {
          // ignore
        }
      });

      // subscribe
      const sub = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presence using configured userId (may be undefined)
          await channel.track({ userId });

          // Try to derive a stable client id from the supabase/channel
          // runtime. Different runtime versions expose different props so
          // attempt a few fallbacks before creating a local id.
          try {
            const ch = channel as unknown as { subscription?: { id?: string }; id?: string; socket?: { id?: string } };
            const supabaseRec = supabase as unknown as Record<string, unknown>;
            const derived =
              userId ||
              ch?.subscription?.id ||
              ch?.id ||
              ch?.socket?.id ||
              (((supabaseRec['realtime'] as Record<string, unknown> | undefined)?.['connection'] as Record<string, unknown> | undefined)?.['id'] as string | undefined) ||
              (((supabaseRec['realtime'] as Record<string, unknown> | undefined)?.['client'] as Record<string, unknown> | undefined)?.['connection'] as Record<string, unknown> | undefined)?.['id'] as string | undefined;
            clientIdRef.current =
              (typeof derived === "string" && derived) ||
              `local-${Math.random().toString(36).slice(2, 9)}`;
          } catch (err) {
            clientIdRef.current = `local-${Math.random()
              .toString(36)
              .slice(2, 9)}`;
          }

          console.info("Subscribed to room", sessionId, "clientId:", clientIdRef.current);

          // Always request the latest document from peers
          channel.send({
            type: "broadcast",
            event: "yjs-request-state",
            payload: { from: clientIdRef.current },
          });
        }
      });

      // --- Broadcast handlers for identity exchange ---
      // When a peer asks "who-are-you" respond with our user id and display name
      channel.on(
        "broadcast",
        { event: "who-are-you" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const to = pl.to as string | undefined;
            const from = pl.from as string | undefined;
            if (!to || to !== clientIdRef.current) return;
            // send identity back to requester
            const displayName = user && (user.name || "peer");
            try {
              channel.send({
                type: "broadcast",
                event: "i-am",
                payload: {
                  to: from,
                  from: clientIdRef.current,
                  user: { id: userId, name: displayName },
                },
              });
            } catch (err) {
              // ignore
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // When a peer responds with their identity, cache it and show a toast
      channel.on(
        "broadcast",
        { event: "i-am" },
        (payload: BroadcastPayload) => {
          try {
            const pl = payload.payload ?? {};
            const to = pl.to as string | undefined;
            const from = pl.from as string | undefined;
            const user = (pl.user as { id?: string; name?: string } | undefined) ?? {};
            if (!to || to !== clientIdRef.current) return;
            if (!from) return;
            
            // Check if this peer has a pending leave (quick reconnect scenario)
            const wasPendingLeave = !!pendingLeavesRef.current[from];
            
            // Cancel any pending leave event for this peer
            if (pendingLeavesRef.current[from]) {
              clearTimeout(pendingLeavesRef.current[from].timeoutId);
              delete pendingLeavesRef.current[from];
              console.log("realtime: cancelled pending leave for", from, "(i-am received)");
            }
            
            // If we don't currently show a peer, adopt this one for the
            // header. If we already show a peer and this is the same id,
            // update the displayed name in case it changed.
            // Only show a username or the literal string 'User' as fallback.
            const displayName = (user && user.name) || "User";
            // Update both state and refs atomically so presence.leave and
            // other handlers read consistent values (avoid stale closures).
            setPeerIdDisplayed(from);
            peerIdDisplayedRef.current = from;
            setPeerUsernameState(displayName);
            peerUsernameRef.current = displayName;

            // Only show "joined" toast if this is a true new join, not a quick reconnect
            if (!wasPendingLeave) {
              try {
                pushToast(`${displayName} joined the session`);
              } catch (err) {
                // ignore
              }
            }
          } catch (err) {
            // ignore
          }
        }
      );

      // broadcast local yjs updates
      ydocRef.current.on("update", (update) => {
        channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: { update: Array.from(update) },
        });
      });

      channelRef.current = channel;

      // --- Periodic auto-save snapshot ---
      if (snapshotIntervalRef.current)
        clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = setInterval(() => {
        persistSnapshot(
          baseApiUrl,
          sessionId,
          ytextRef.current.toString()
        ).catch(() => void 0);
      }, 5000);

      return sub;
    },
    [supabase, sessionId, userId, endSession]
  );

  // fetch initial code
  useEffect(() => {
    let aborted = false;
    async function initSession() {
      try {
        const resp = await axiosInstance.get(
          `${baseApiUrl}/sessions/${sessionId}`
        );
        if (resp.status !== 200) throw new Error(`Session fetch failed`);
        const session = resp.data;
        // If backend allowed a completed session through for any reason,
        // redirect to home. We also defensively handle forbidden/unauth access
        // via the catch block below.
        if (session?.status === "completed") {
          // redirect user to home page
          router.push("/");
          return;
        }
        if (aborted) return;
        // Prefer session.current_code if present. Otherwise fall back to the
        // first code snippet attached to the question (if any).
        const sessionCode =
          typeof session.current_code === "string" && session.current_code
            ? session.current_code
            : "";

        // If the session has an authoritative language selection, use it
        // to initialise the editor language for all participant.
        const sessionLang =
          typeof session.current_language === "string" &&
            session.current_language
            ? session.current_language
            : undefined;
        if (sessionLang) setSelectedLanguage(sessionLang);

        const questionSnippet =
          question?.codeSnippets && question.codeSnippets.length > 0
            ? // try a few common fields for snippet content
            question.codeSnippets[0].code ||
            question.codeSnippets[0].content ||
            question.codeSnippets[0].snippet ||
            ""
            : "";

        // If session has code use it. Otherwise, only use the question
        // snippet if the session already has an authoritative language
        // selected. This avoids seeding code into the session when no
        // language is chosen.
        const initial =
          sessionCode || (sessionLang ? questionSnippet : "") || "";

        // Expose initial code to CodeMirror via defaultValue
        setInitialCode(initial || undefined);

        // Join realtime channel and let joinRealtimeChannel insert into Y.Text
        await joinRealtimeChannel(initial);

        // If session had no persisted code but question provided a snippet,
        // persist it so subsequent joins see it from the session row. Only
        // persist when an authoritative language exists for the session.
        if (!sessionCode && questionSnippet && sessionLang) {
          // Best-effort persist; ignore errors
          persistSnapshot(baseApiUrl, sessionId, questionSnippet).catch(
            () => void 0
          );
        }
      } catch (e: unknown) {
        // If the request was blocked due to authorization (user not a
        // participant) or the session is completed, redirect to home.
        try {
          // axios errors expose `response.status`
          const err = e as { response?: { status?: number } };
          const status = err?.response?.status;
          if (status === 401 || status === 403 || status === 410) {
            router.push("/");
            return;
          }
        } catch (inner) {
          // ignore
        }
        console.log(`Error: ${e instanceof Error ? e.message : e}`);
      }
    }
    initSession();
    return () => {
      aborted = true;
    };
  }, [sessionId, joinRealtimeChannel]);

  // clean up
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current)
        clearInterval(snapshotIntervalRef.current);
      channelRef.current?.unsubscribe();
      // clear any pending fallback initial insert
      if (initialInsertTimeoutRef.current) {
        clearTimeout(initialInsertTimeoutRef.current);
        initialInsertTimeoutRef.current = null;
      }
    };
  }, []);

  // Listen for a global end-session event dispatched by the header/button
  // in case the header is rendered outside the realtime provider. When this
  // event is received we call the same local endSession function which will
  // broadcast the exit_session message to other clients and perform cleanup.
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ev = e as CustomEvent<{ sessionId?: string }>;
        // if event specifies a sessionId and it doesn't match, ignore
        if (
          ev &&
          ev.detail &&
          ev.detail.sessionId &&
          ev.detail.sessionId !== sessionId
        )
          return;
        endSession();
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("peerprep:end_session", handler as EventListener);
    return () =>
      window.removeEventListener(
        "peerprep:end_session",
        handler as EventListener
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endSession]);

  // handlers for user accepting/rejecting an incoming proposal
  const respondToProposal = useCallback(
    (accept: boolean) => {
      if (!incomingProposal) return;
      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "language-response",
          payload: {
            to: incomingProposal.from,
            from: clientIdRef.current,
            language: incomingProposal.language,
            accept,
            proposalId: incomingProposal.proposalId,
          },
        });
      } catch (err) {
        // ignore
      }
      // clear incoming prompt UI
      incomingProposalRef.current = null;
      setIncomingProposal(null);
    },
    [incomingProposal, userId]
  );

  const extensions = useMemo(() => {
    const langConfig =
      languageMap[selectedLanguage as keyof typeof languageMap];
    const langExtensions = langConfig?.extension || [
      javascript(),
      indentUnit.of("  "),
    ];
    // Add a small bottom padding so final line is reachable.
    const editorPaddingTheme = EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { paddingBottom: "3.5rem" },
    });

    const base = [
      ...langExtensions,
      oneDark,
      indentOnInput(),
      keymap.of([indentWithTab]),
      EditorView.lineWrapping,
      editorPaddingTheme,
    ];

    // When no language is selected, make the editor non-editable and readOnly
    // so users are encouraged to pick a language first. Programmatic updates
    // are still allowed (we still can insert snippets into Y.Text).
    if (!selectedLanguage) {
      base.push(EditorView.editable.of(false));
      base.push(EditorState.readOnly.of(true));
    }

    // y-collab (CRDT) integration
    const awareness: Awareness | undefined = undefined;
    base.push(yCollab(ytextRef.current, awareness, { undoManager: false }));

    // Add remote cursor decorations/state
    base.push(remoteCursorsField);
    // Gutter markers for remote cursors (colored dot next to line numbers)
    base.push(remoteGutterField);
    // helper to show a small styled tooltip when hovering over gutter dots
    const showGutterTooltip = (el: HTMLElement | null, text: string | undefined, color?: string) => {
      if (!el || !text) return;
      // remove existing
      const existing = document.getElementById("cm-gutter-tooltip");
      if (existing) existing.remove();
      const tip = document.createElement("div");
      tip.id = "cm-gutter-tooltip";
      tip.className = "cm-gutter-tooltip";
      tip.style.position = "fixed";
      tip.style.zIndex = "99999";
      tip.style.background = color || "#111827";
      tip.style.color = "white";
      // reduce left padding so text sits closer to the left edge
      tip.style.padding = "6px";
      tip.style.borderRadius = "12px";
      tip.style.fontSize = "12px";
      tip.style.pointerEvents = "none";
      tip.style.display = "flex";
      tip.style.alignItems = "center";
      tip.style.gap = "0px";
      tip.style.boxShadow = `0 6px 18px ${color || "#000000"}66`;

      const label = document.createElement("span");
      label.textContent = text;
      label.style.whiteSpace = "nowrap";
      label.style.fontWeight = "600";

      tip.appendChild(label);

      document.body.appendChild(tip);
      const r = el.getBoundingClientRect();
      // position to the right of the gutter marker, then clamp
      const tipRect = tip.getBoundingClientRect();



      
      // use a smaller offset so the tooltip sits closer to the gutter dot
      let left = r.right + 2;
      if (left + tipRect.width + 8 > window.innerWidth) left = window.innerWidth - tipRect.width - 8;
      if (left < 8) left = 8;
      tip.style.left = `${left}px`;
      const top = Math.max(8, r.top + (r.height - tipRect.height) / 2);
      tip.style.top = `${top}px`;
    };
    const removeGutterTooltip = () => {
      const existing = document.getElementById("cm-gutter-tooltip");
      if (existing) existing.remove();
    };

    // spacer marker so the remote gutter is always rendered (open) even when empty
    const gutterSpacer = new (class extends GutterMarker {
      toDOM() {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "1px";
        el.style.visibility = "hidden";
        return el;
      }
    })();

    base.push(
      gutter({
        initialSpacer: () => gutterSpacer,
        class: "cm-gutter-remote",
        markers: (view) => view.state.field(remoteGutterField),
        widgetMarker: (view, marker) => marker as unknown as GutterMarker,
        side: "before",
        domEventHandlers: {
          mouseover(view, line, event) {
            try {
              const target = (event?.target || null) as HTMLElement | null;
              // If the event target is inside the gutter marker element, find the dot
              const el = target?.closest?.('.cm-remote-gutter-dot') as HTMLElement | null;
              if (!el) return false;
              const title = el.getAttribute('title') || el.dataset?.username;
              const color = el.dataset?.color;
              showGutterTooltip(el, title || undefined, color);
            } catch (err) {
              // ignore
            }
            return true;
          },
          mouseout(view, line, event) {
            try {
              // remove tooltip when leaving the gutter marker
              removeGutterTooltip();
            } catch (err) {
              // ignore
            }
            return true;
          }
        }
      })
    );
    base.push(
      EditorView.baseTheme({
        ".cm-gutter-remote .cm-gutterElement": {
          paddingLeft: "0",
          paddingRight: "0",
        },
        ".cm-gutter-tooltip": {
          // will be created/positioned in JS; theme here for safety
        }
      })
    );

    // Update listener: publish selection (cursor) updates to peers
    base.push(
      EditorView.updateListener.of((update) => {
        try {
          if (!update.view) return;
          // on selection change, broadcast cursor pos
          if (update.selectionSet) {
            const sel = update.state.selection.main;
            const payload = {
              anchor: sel.anchor,
              head: sel.head,
              ts: Date.now(),
            };
            const cid = clientIdRef.current || `local-${Math.random().toString(36).slice(2, 9)}`;
            const userLabel = (user && (user.name || (user.email as string) || user.id)) || cid;
            // update local cache
            const map = {
              ...(remoteCursorsRef.current || {}),
              [cid]: { ...payload, userName: userLabel, color: pickColor(cid), ts: Date.now() },
            };
            remoteCursorsRef.current = map;
            update.view.dispatch({ effects: [setRemoteCursorsEffect.of(map), setRemoteGutterEffect.of(map)] });
            // broadcast to peers
            try {
              channelRef.current?.send({
                type: "broadcast",
                event: "cursor-update",
                payload: { clientId: cid, selection: payload, user: { name: userLabel }, ts: Date.now() },
              });
            } catch (err) {
              // ignore
            }
          }
        } catch (err) {
          // ignore
        }
      })
    );

    return base;
  }, [selectedLanguage]);

  // Persist language selection to backend so the session row's
  // `current_language` column stays authoritative. This is a lightweight
  // helper used by the language selection UI.
  const requestLanguageChange = useCallback(
    (language: string) => {
      // generate proposal id/timestamp up-front so they are available
      // for the timeout cleanup closure and ref storage
      const proposalId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const ts = Date.now();
      try {
        // Update UI state immediately
        // Instead of applying immediately, send a proposal to peers and wait
        // for their response. The originator will apply the change only when
        // another participant accepts.
        try {
          // remember previous language so we can revert on rejection/timeout
          prevLanguageRef.current = selectedLanguage;
          channelRef.current?.send({
            type: "broadcast",
            event: "language-proposal",
            payload: { language, from: clientIdRef.current, proposalId, ts },
          });
        } catch (err) {
          // ignore
        }

        // show local pending UI and prepare a timeout to abort if nobody answers
        // If there's an existing pending proposal, clear its timer so the
        // new proposal starts a fresh countdown.
        if (proposalPending && proposalPending.timeoutId) {
          clearTimeout(proposalPending.timeoutId);
        }
        if (pendingProposalRef.current && pendingProposalRef.current.timeoutId) {
          clearTimeout(pendingProposalRef.current.timeoutId);
        }
        // clear any previous pending ref before creating a new pending entry
        pendingProposalRef.current = null;
        const timeoutId = window.setTimeout(() => {
          // no response -> cancel the proposal and notify peers so they
          // can clear any incoming prompts. Also revert local UI state.
          try {
            channelRef.current?.send({
              type: "broadcast",
              event: "language-cancel",
              payload: { from: clientIdRef.current, language, proposalId },
            });
          } catch (err) {
            // ignore send errors
          }

          // clear pending state
          if (pendingProposalRef.current && pendingProposalRef.current.timeoutId) {
            clearTimeout(pendingProposalRef.current.timeoutId);
          }
          pendingProposalRef.current = null;
          setProposalPending(null);

          // revert UI selection
          if (prevLanguageRef.current) {
            setSelectedLanguage(prevLanguageRef.current);
            prevLanguageRef.current = null;
          }

          try {
            pushToast(`Language change to ${language} timed out and was cancelled`, 5000);
          } catch (err) {
            // ignore
          }
        }, 10000);
        const pending = { language, timeoutId, proposalId, ts };
        pendingProposalRef.current = pending;
        // UI state keeps same shape as before (language + timeoutId)
        setProposalPending({ language, timeoutId });
        // reset countdown UI to full TTL
        try {
          setProposalCountdownMs(10000);
        } catch (err) {
          // ignore
        }
      } catch (err) {
        // ignore
      }
    },
    [sessionId]
  );

  // TEST ONLY: automatic cyclic typing in one tab
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.includes("autotype")) return;

    let i = 0;
    const chars = "123456789";
    const ytext = ytextRef.current;

    const interval = setInterval(() => {
      const char = chars[i % chars.length];
      // Insert char at end
      ytext.insert(ytext.length, char);
      // Keep document short by deleting old chars
      if (ytext.length > 500) ytext.delete(0, ytext.length - 50);
      i++;
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{ channel: channelRef.current, endSession }}
    >
      {sessionEnded && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white z-[9999] backdrop-blur-sm">
          <div className="text-center space-y-4 animate-fade-in">
            <p className="text-2xl font-semibold">
              The collaboration session has ended.
            </p>
            <p className="text-sm text-gray-300">
              Redirecting you to the home page...
            </p>
          </div>
        </div>
      )}

      {/* Incoming proposal modal */}
      {incomingProposal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Language change proposed"
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white text-black rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 z-50">
            <h3 className="text-lg font-semibold mb-2 text-black">
              Language change proposed
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              <strong className="font-semibold text-black">{getPeerName(incomingProposal.from, "User")}</strong>{" "}
              proposes to change the editor language to{" "}
              <strong className="font-semibold text-black">
                {incomingProposal.language}
              </strong>
              .
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => respondToProposal(false)}
                className="px-3 py-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                Reject
              </button>
              <button
                onClick={() => respondToProposal(true)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Originator pending banner */}
      {proposalPending && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997]">
          <div className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 px-4 py-2 rounded shadow">
            Waiting for other participant to accept language change to{" "}
            <strong>{proposalPending.language}</strong>
            {proposalCountdownMs !== null && (
              <span className="ml-3 inline-block text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {Math.ceil(proposalCountdownMs / 1000)}s
              </span>
            )}
            <button
              onClick={() => {
                // send cancel notification to peers so they can clear their prompt
                try {
                  const lang = proposalPending?.language;
                  const pid = pendingProposalRef.current?.proposalId;
                  channelRef.current?.send({
                    type: "broadcast",
                    event: "language-cancel",
                    payload: {
                      from: clientIdRef.current,
                      language: lang,
                      proposalId: pid,
                    },
                  });
                } catch (err) {
                  // ignore
                }
                if (proposalPending.timeoutId)
                  clearTimeout(proposalPending.timeoutId);
                // clear pending ref and revert selection
                pendingProposalRef.current = null;
                if (prevLanguageRef.current) {
                  setSelectedLanguage(prevLanguageRef.current);
                  prevLanguageRef.current = null;
                }
                setProposalPending(null);
              }}
              className="ml-3 underline text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9997] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-4 py-2 rounded shadow flex items-center justify-between max-w-sm"
            >
              <div className="mr-3 break-words">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-2 text-sm underline"
                aria-label="Close toast"
              >
                Close
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header (can be rendered by parent if desired) */}
        {showHeader && (
          <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-600/30">
            <CodeEditorHeader
              sessionId={sessionId}
              // peer username is tracked in state so header updates when peers join/leave
              peerUsername={peerUsernameState}
              // provide our own display name when available
              ownUsername={user?.name || undefined}
              isBlocked={false} // everyone can edit
            />
          </div>
        )}

        {/* Language & Execute controls */}
        <CodeEditorLanguageSelectionAndRunButton
          selectedLanguage={selectedLanguage ?? ""}
          setSelectedLanguage={setSelectedLanguage}
          setCode={() => { }} // not used with Yjs
          availableLanguages={
            question?.codeSnippets?.map((s) => s.lang || s.language) || [
              "Python",
              "JavaScript",
              "C++",
            ]
          }
          executeCode={executeCode}
          isBlocked={false}
          languageMap={languageMap}
          onRequestLanguageChange={requestLanguageChange}
        />

        {/* If no language is selected, don't even show the editor; show a chooser panel in-place */}
        {!selectedLanguage ? (
          <div className="flex-1 flex items-center justify-center p-8 min-h-[200px]">
            <div className="w-full max-w-2xl text-center rounded-lg p-8">
              <h3 className="text-xl text-slate-300 font-semibold mb-2">
                Choose a language to enable the editor
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                The collaborative editor is disabled until a language is
                selected. Choose a language with the language dropdown above to
                get started.
              </p>
            </div>
          </div>
        ) : (
          /* Main editor */
          <div className="flex flex-1 min-h-0 gap-4 p-4">
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <div className="flex-1 rounded-lg overflow-hidden border border-slate-600/50 shadow-inner min-h-0 h-full">
                <CodeMirror
                  className="h-full"
                  // Let yCollab / Y.Text control the document. We must NOT set
                  // `defaultValue` here when using CRDT-backed yCollab because
                  // that can lead to the same snippet being rendered both as the
                  // editor's initial value and later inserted into the Y.Text,
                  // producing duplicates. The CRDT insertion (in
                  // `joinRealtimeChannel`) is authoritative.
                  // key the editor by session and language so switching sessions
                  // or changing language forces a fresh mount. Also pass the
                  // current Y.Text value as `value` at mount time so CodeMirror's
                  // initial document matches the shared document and remote
                  // delta ranges won't be out-of-range.
                  key={`${sessionId}-${selectedLanguage || "none"}`}
                  // Only provide an initial `value` to CodeMirror when the
                  // shared Y.Text already contains content. If we pass a
                  // non-empty `value` while the Y.Text is empty, CodeMirror
                  // will render that content locally and then the fallback
                  // insert (or a later Yjs update) can insert the same
                  // snippet into the CRDT, producing duplicated text. By
                  // setting `value` to `undefined` when Y.Text is empty we
                  // let the CRDT (yCollab) be the single source of truth for
                  // initial content and avoid duplicate inserts.
                  value={
                    ytextRef.current && ytextRef.current.length > 0
                      ? ytextRef.current.toString()
                      : undefined
                  }
                  height="100%"
                  theme={oneDark}
                  extensions={extensions}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                  }}
                  onCreateEditor={(view) => {
                    try {
                      editorViewRef.current = view;
                      // ensure decorations reflect any cached remote cursors
                      view.dispatch({ effects: [setRemoteCursorsEffect.of(remoteCursorsRef.current), setRemoteGutterEffect.of(remoteCursorsRef.current)] });
                    } catch (err) {
                      // ignore
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <CodeEditorSubmissionResults submissionHistory={submissionHistory} />
      </div>
    </RealtimeContext.Provider>
  );
}

async function persistSnapshot(
  baseUrl: string,
  sessionId: string,
  code?: string,
  language?: string
) {
  const body: Record<string, unknown> = {};
  if (typeof code === "string") body.code = code;
  if (typeof language === "string") body.language = language;
  if (Object.keys(body).length === 0) return;
  await axiosInstance.patch(`${baseUrl}/sessions/${sessionId}/snapshot`, body, {
    headers: { "Content-Type": "application/json" },
  });
}
