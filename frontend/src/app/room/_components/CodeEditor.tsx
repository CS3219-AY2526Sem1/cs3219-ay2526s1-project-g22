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
};

export default function CodeEditor({ sessionId, question }: Props) {
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
          tests: langConfig.testTemplate,
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

  const endSession = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: "broadcast",
      event: "exit_session",
      payload: { type: "end_session", from: userId, ts: Date.now() },
    });
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setSessionEnded(true);
    setTimeout(() => router.push("/"), 1000);
  }, [userId, router]);

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

      // exit session for both users
      channel.on("broadcast", { event: "exit_session" }, (payload) => {
        const data = payload.payload as { type: string; from: string };
        if (data.type === "end_session") endSession();
      });

      const sub = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId });
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

      // init code
      if (initialCode && ytextRef.current.length === 0) {
        ytextRef.current.insert(0, initialCode);
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
        const initial =
          typeof session.current_code === "string" ? session.current_code : "";
        await joinRealtimeChannel(initial);
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
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-600/30">
          <CodeEditorHeader
            sessionId={sessionId}
            userId={userId || "unknown"}
            isBlocked={false} // everyone can edit
          />
        </div>

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
