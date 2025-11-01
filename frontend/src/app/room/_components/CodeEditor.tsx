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
import { EditorView, keymap } from "@codemirror/view";
import { RealtimeChannel } from "@supabase/supabase-js";
import CodeMirror from "@uiw/react-codemirror";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RealtimeContext from "../contexts/realtime-context";
import CodeEditorHeader from "./CodeEditorHeader";
import CodeEditorLanguageSelectionAndRunButton from "./CodeEditorLanguageSelectionAndRunButton";
import CodeEditorSubmissionResults from "./CodeEditorSubmissionResults";

// --- YJS imports ---
import { yCollab } from "y-codemirror.next";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import * as Y from "yjs";

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

export default function CodeEditor({
  sessionId,
  question,
  showHeader = true,
}: Props) {
  const router = useRouter();
  const [sessionEnded, setSessionEnded] = useState(false);
  const { user } = useUser();
  const userId = user?.id;

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("JavaScript");
  const [submissionHistory, setSubmissionHistory] = useState<
    SubmissionResult[]
  >([]);

  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // yjs setup
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const ytextRef = useRef<Y.Text>(ydocRef.current.getText("codemirror"));
  const awarenessRef = useRef<Awareness>(new Awareness(ydocRef.current));
  useEffect(() => {
    const awareness = awarenessRef.current;
    awareness.setLocalStateField("user", {
      name: userId || "anon",
      color: "#FF0000",
    });
  }, [userId]);

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

  // endSession optionally sends a broadcast to notify other participants.
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
        const update = new Uint8Array(payload.payload.update);
        Y.applyUpdate(ydocRef.current, update);
      });

      // apply awareness update
      channel.on("broadcast", { event: "awareness-update" }, (payload) => {
        const update = new Uint8Array(payload.payload.update);
        applyAwarenessUpdate(awarenessRef.current, update, "remote");
      });

      // send a vector update of the full document state to the new joiner
      channel.on("broadcast", { event: "yjs-request-state" }, (payload) => {
        const { from } = payload.payload;
        if (!from || from === userId) return;
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
        if (to === userId) {
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

      // subscribe
      const sub = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId });
          console.info("Subscribed to room", sessionId);

          // Always request the latest document from peers
          channel.send({
            type: "broadcast",
            event: "yjs-request-state",
            payload: { from: userId },
          });
        }
      });

      // broadcast local yjs updates
      ydocRef.current.on("update", (update) => {
        channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: { update: Array.from(update) },
        });
      });

      // broadcast awareness changes
      awarenessRef.current.on(
        "update",
        ({
          added,
          updated,
          removed,
        }: {
          added: number[];
          updated: number[];
          removed: number[];
        }) => {
          const changed = added.concat(updated, removed);
          const update = encodeAwarenessUpdate(awarenessRef.current, changed);
          channel.send({
            type: "broadcast",
            event: "awareness-update",
            payload: { update: Array.from(update) },
          });
        }
      );

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
        if (aborted) return;
        const initial =
          typeof session.current_code === "string" ? session.current_code : "";
        await joinRealtimeChannel(initial);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.log(`Error: ${error.message}`);
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

  const extensions = useMemo(() => {
    const langConfig =
      languageMap[selectedLanguage as keyof typeof languageMap];
    const langExtensions = langConfig?.extension || [
      javascript(),
      indentUnit.of("  "),
    ];
    return [
      ...langExtensions,
      oneDark,
      indentOnInput(),
      keymap.of([indentWithTab]),
      EditorView.lineWrapping,
      yCollab(ytextRef.current, awarenessRef.current, { undoManager: false }),
    ];
  }, [selectedLanguage]);

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

      <div className="flex flex-col h-full">
        {/* Header (can be rendered by parent if desired) */}
        {showHeader && (
          <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-600/30">
            <CodeEditorHeader
              sessionId={sessionId}
              userId={userId || "unknown"}
              isBlocked={false} // everyone can edit
            />
          </div>
        )}

        {/* Language & Execute controls */}
        <CodeEditorLanguageSelectionAndRunButton
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          setCode={() => {}} // not used with Yjs
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
        />

        {/* Main editor */}
        <div className="flex flex-1 min-h-0 gap-4 p-4">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 rounded-lg overflow-hidden border border-slate-600/50 shadow-inner">
              <CodeMirror
                value={""}
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
              />
            </div>
          </div>
        </div>

        <CodeEditorSubmissionResults submissionHistory={submissionHistory} />
      </div>
    </RealtimeContext.Provider>
  );
}

async function persistSnapshot(
  baseUrl: string,
  sessionId: string,
  code: string
) {
  await axiosInstance.patch(
    `${baseUrl}/sessions/${sessionId}/snapshot`,
    { code },
    { headers: { "Content-Type": "application/json" } }
  );
}
