"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { indentOnInput, indentUnit } from "@codemirror/language";
import { indentWithTab } from "@codemirror/commands";
import { debounce } from "lodash";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/supabase-client";
import { AnyPayload, CodeUpdatePayload } from "../types/realtime";
import { useUser } from "@/contexts/user-context";
import axiosInstance from "@/lib/axios";
import { Question } from "@/queries/use-get-questions";
import { languageMap } from "@/utils/language-config";
import CodeEditorHeader from "./CodeEditorHeader";
import CodeEditorLanguageSelectionAndRunButton from "./CodeEditorLanguageSelectionAndRunButton";
import CodeEditorSubmissionResults from "./CodeEditorSubmissionResults";
import RealtimeContext from "../contexts/realtime-context";
import { useRouter } from "next/navigation";

// --- YJS imports ---
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

interface CodeSnippet {
  lang?: string;
  language?: string;
  code?: string;
  content?: string;
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
  // initial code to show in the editor (from session or question snippet)
  const [initialCode, setInitialCode] = useState<string | undefined>(
    undefined
  );

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

      // exit session for both users -- robust parsing + diagnostics
      channel.on("broadcast", { event: "exit_session" }, (payload) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = payload as any;
          console.debug("realtime: exit_session raw payload", raw);

          // try a few common places where the sent payload may appear
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const maybe = raw.payload ?? raw.message ?? raw.data ?? raw;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const candidate = (maybe && (maybe.payload ?? maybe)) as any;

          if (candidate && candidate.type === "end_session") {
            console.info("received exit_session payload", {
              sessionId,
              from: candidate.from,
            });
            // If the payload includes a truthy `from` equal to our userId, it's our own
            // broadcast and we should not re-run endSession. Otherwise run cleanup.
            if (!(candidate.from && candidate.from === userId))
              endSession(false);
          }
        } catch (err) {
          console.warn("realtime: failed to handle exit_session payload", err);
        }
      });

      const sub = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ userId });
            console.info("realtime: subscribed to room channel", {
              room: sessionId,
              userId,
            });
          } catch (err) {
            console.warn("realtime: track failed", err);
          }
        }
      });

      // broadcast local yjs doc update
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
          const changedClients = added.concat(updated, removed);
          const update = encodeAwarenessUpdate(
            awarenessRef.current,
            changedClients
          );
          channel.send({
            type: "broadcast",
            event: "awareness-update",
            payload: { update: Array.from(update) },
          });
        }
      );

      // init code: insert initial only if Y.Text is empty, with small
      // randomized delay to avoid both clients inserting the same snippet
      // concurrently (reduces duplicate snippets).
      if (initialCode && ytextRef.current.length === 0) {
        const delay = 50 + Math.floor(Math.random() * 150);
        setTimeout(async () => {
          try {
            if (ytextRef.current.length === 0) {
              ytextRef.current.insert(0, initialCode);
              // best-effort persist so future joins pick it up from the session
              await persistSnapshot(baseApiUrl, sessionId, initialCode).catch(
                () => void 0
              );
            }
          } catch (err) {
            // ignore
          }
        }, delay);
      }

      channelRef.current = channel;

      // periodic persistence
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
          // Prefer session.current_code if present. Otherwise fall back to the
          // first code snippet attached to the question (if any).
          const sessionCode =
            typeof session.current_code === "string" && session.current_code
              ? session.current_code
              : "";

          const questionSnippet =
            question?.codeSnippets && question.codeSnippets.length > 0
              ? // try a few common fields for snippet content
                (question.codeSnippets[0].code ||
                  question.codeSnippets[0].content ||
                  question.codeSnippets[0].snippet ||
                  "")
              : "";

          // If session has code use it, otherwise use question snippet (if any)
          const initial = sessionCode || questionSnippet || "";

          // Expose initial code to CodeMirror via defaultValue
          setInitialCode(initial || undefined);

          // Join realtime channel and let joinRealtimeChannel insert into Y.Text
          await joinRealtimeChannel(initial);

          // If session had no persisted code but question provided a snippet,
          // persist it so subsequent joins see it from the session row.
          if (!sessionCode && questionSnippet) {
            // Best-effort persist; ignore errors
            persistSnapshot(baseApiUrl, sessionId, questionSnippet).catch(() =>
              void 0
            );
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.log(`Error: ${e.message || e}`);
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
                // Let yCollab / Y.Text control the document. Provide an initial
                // value only via `defaultValue` so we don't overwrite the CRDT.
                defaultValue={initialCode}
                // key the editor by session so switching sessions forces a fresh mount
                key={sessionId}
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
