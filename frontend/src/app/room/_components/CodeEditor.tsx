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
import {
  AnyPayload,
  SyncRequestPayload,
  SyncResponsePayload,
  SyncAckPayload,
  CodeUpdatePayload,
} from "../types/realtime";
import { useUser } from "@/contexts/user-context";
import axiosInstance from "@/lib/axios";
import { Question } from "@/queries/use-get-questions";
import { languageMap } from "@/utils/language-config";
import CodeEditorHeader from "./CodeEditorHeader";
import CodeEditorLanguageSelectionAndRunButton from "./CodeEditorLanguageSelectionAndRunButton";
import CodeEditorSubmissionResults from "./CodeEditorSubmissionResults";

// Type definitions
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

// Language mappings for display and execution
const baseApiUrl = "/api/collaboration-service";
type Props = {
  sessionId: string;
  question?: Question;
};

export default function CodeEditor({ sessionId, question }: Props) {
  const { user } = useUser();
  const userId = user?.id;

  const [code, setCode] = useState<string>("// Loading session...\n");
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  // Language selection and execution states
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("JavaScript");
  const [submissionHistory, setSubmissionHistory] = useState<
    SubmissionResult[]
  >([]);

  // Get available languages from question codeSnippets or default
  const availableLanguages = useMemo(() => {
    if (!question?.codeSnippets) return ["Python", "JavaScript", "C++"];

    return question.codeSnippets
      .map((snippet: CodeSnippet) => {
        if (
          !(snippet.lang === "Python3") &&
          !(snippet.language === "Python3")
        ) {
          return snippet.lang || snippet.language;
        }
      })
      .filter(Boolean) as string[];
  }, [question?.codeSnippets]);

  // Get current code snippet from question
  const currentQuestionCode = useMemo(() => {
    if (!question?.codeSnippets) {
      const defaultSnippets = {
        Python: "def solve():\n    # Your code here\n    pass",
        JavaScript: "function solve() {\n    // Your code here\n}",
        "C++":
          "// Your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
      };
      return (
        defaultSnippets[selectedLanguage as keyof typeof defaultSnippets] || ""
      );
    }

    const snippet = question.codeSnippets.find(
      (s: CodeSnippet) => (s.lang || s.language) === selectedLanguage
    );
    return snippet?.code || snippet?.content || "";
  }, [question?.codeSnippets, selectedLanguage]);

  // Update code when language changes (only if no user code exists)
  useEffect(() => {
    if (code === "// Loading session...\n" || code.trim() === "") {
      setCode(currentQuestionCode);
    }
  }, [selectedLanguage, currentQuestionCode, code]);

  useEffect(() => {
    setCode(currentQuestionCode);
    broadcastChange(currentQuestionCode);
  }, [selectedLanguage]);

  // Execute code function
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
          code: code,
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

  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const applyingRemoteRef = useRef(false);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Join Supabase channel
  const joinRealtimeChannel = useCallback(
    async (initialCode: string) => {
      console.log(
        "Joining channel with initial code:",
        initialCode.slice(0, 50)
      );
      const channel = supabase.channel(`room-${sessionId}`, {
        config: { presence: { key: userId } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
      });

      channel.on("broadcast", { event: "editor" }, (payload) => {
        const data = payload.payload as AnyPayload;
        switch (data.type) {
          case "sync_request": {
            if (data.from === userId) break;
            safeBroadcast(channel, {
              type: "sync_response",
              to: data.from,
              from: userId,
              code: codeRef.current,
              ts: nowTs(),
            } as SyncResponsePayload);
            break;
          }
          case "sync_response": {
            if (data.to !== userId) return;
            applyingRemoteRef.current = true;
            setCode(data.code);
            setIsBlocked(false);
            safeBroadcast(channel, {
              type: "sync_ack",
              to: data.from,
              from: userId,
              ts: nowTs(),
            } as SyncAckPayload);
            break;
          }
          case "sync_ack": {
            if (data.to !== userId) return;
            setIsBlocked(false);
            break;
          }
          case "code_update": {
            if (data.from === userId) return;
            applyingRemoteRef.current = true;
            setCode(data.code);
            break;
          }
        }
      });

      const sub = await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId });
          const ids = Object.keys(channel.presenceState() || {});
          if (ids.length > 1) {
            setIsBlocked(true);
            safeBroadcast(channel, {
              type: "sync_request",
              from: userId,
              ts: nowTs(),
            } as SyncRequestPayload);
          } else {
            setIsBlocked(false);
          }
        }
      });

      channelRef.current = channel;
      if (snapshotIntervalRef.current)
        clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = setInterval(() => {
        persistSnapshot(baseApiUrl, sessionId, codeRef.current).catch(
          () => void 0
        );
      }, 5000);
      return sub;
    },
    [supabase, sessionId, userId]
  );

  // Fetch session and initial code
  useEffect(() => {
    let aborted = false;
    async function initSession() {
      try {
        const resp = await axiosInstance.get(
          `${baseApiUrl}/sessions/${sessionId}`
        );
        if (resp.status !== 200)
          throw new Error(`Session fetch failed (${resp.status})`);
        const session = resp.data;
        if (aborted) return;

        const initial =
          typeof session.current_code === "string" ? session.current_code : "";
        setCode(initial);
        await joinRealtimeChannel(initial);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.log(`Error: ${e.message || e}`);
      }
    }
    initSession();
    return () => {
      aborted = true;
    };
  }, [sessionId, joinRealtimeChannel, question]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current)
        clearInterval(snapshotIntervalRef.current);
      channelRef.current?.unsubscribe();
    };
  }, []);

  // Debounced broadcaster
  const broadcastChange = useMemo(
    () =>
      debounce(
        (nextCode: string) => {
          const channel = channelRef.current;
          if (!channel) return;
          safeBroadcast(channel, {
            type: "code_update",
            from: userId,
            code: nextCode,
            ts: nowTs(),
          } as CodeUpdatePayload);
        },
        100,
        { leading: true, trailing: true }
      ),
    [userId]
  );

  const onChange = useCallback(
    (value: string) => {
      if (isBlocked) return;
      if (applyingRemoteRef.current) {
        applyingRemoteRef.current = false;
        setCode(value);
        return;
      }
      setCode(value);
      broadcastChange(value);
    },
    [isBlocked, broadcastChange]
  );

  const extensions = useMemo(() => {
    const langConfig =
      languageMap[selectedLanguage as keyof typeof languageMap];
    const langExtensions = langConfig?.extension || [
      javascript(),
      indentUnit.of("  "),
    ];

    return [
      ...langExtensions,
      EditorView.lineWrapping,
      EditorView.editable.of(!isBlocked),
      indentOnInput(),
      keymap.of([indentWithTab]),
    ];
  }, [isBlocked, selectedLanguage]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with room info and controls */}
      <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-600/30">
        <CodeEditorHeader
          sessionId={sessionId}
          userId={userId || "unknown"}
          isBlocked={isBlocked}
        />
      </div>

      {/* Language Selection and Execute Controls */}
      <CodeEditorLanguageSelectionAndRunButton
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        setCode={setCode}
        availableLanguages={availableLanguages}
        executeCode={executeCode}
        isBlocked={isBlocked}
        languageMap={languageMap}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 rounded-lg overflow-hidden border border-slate-600/50 shadow-inner">
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={extensions}
              onChange={onChange}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false,
              }}
            />
          </div>
        </div>
      </div>

      {/* Execution Results Sidebar */}
      <CodeEditorSubmissionResults submissionHistory={submissionHistory} />
    </div>
  );
}

// interface used to broadcast into the channel
function safeBroadcast(channel: RealtimeChannel, payload: AnyPayload) {
  channel.send({ type: "broadcast", event: "editor", payload });
}

// updates record in the db
async function persistSnapshot(
  baseUrl: string,
  sessionId: string,
  code: string
) {
  await axiosInstance.patch(
    `${baseUrl}/sessions/${sessionId}/snapshot`,
    { code },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

function nowTs() {
  return Date.now();
}
