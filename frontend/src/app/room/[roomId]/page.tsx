"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import CodeEditor from "../_components/CodeEditor";
import ChatPanel from "../_components/ChatPanel";
import CodeEditorHeader from "../_components/CodeEditorHeader";
import { useUser } from "@/contexts/user-context";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = React.use(params);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [question, setQuestion] = useState<any>(null);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        // 1. Fetch session to get question_id
        const sessionRes = await axiosInstance.get(
          `/api/collaboration-service/sessions/${roomId}`
        );
        const session = sessionRes.data;
        const questionId = session.question_id;
        console.log("question id:", questionId);
        if (!questionId) throw new Error("No question_id in session");
        // 2. Fetch question by id
        try {
          const questionRes = await axiosInstance.get(
            `/api/question-service/questions/${questionId}`
          );
          setQuestion(questionRes.data);
        } catch (err) {
          // Fallback: fetch a random question
          // const randomRes = await axiosInstance.get(
          //   `/api/question-service/questions/random`
          // );
          // setQuestion({ ...randomRes.data, fallback: true });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        // If backend returns 401/403/404/410 (unauthorized/forbidden/not found/gone)
        // redirect to home so users cannot access a non-existent session.
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 410) {
          router.push("/");
          return;
        }

        setError(err.message || "Failed to load question");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestion();
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading question...</div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Question Sidebar */}
      <div className="w-2/5 min-h-0 flex flex-col">
        <div className="flex-1 p-6 overflow-hidden">
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600/50 h-full flex flex-col shadow-2xl gap-0">
            <CardHeader className="pb-4 border-b border-slate-600/30">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-white text-xl font-bold leading-tight flex-1">
                  {question?.title || "No Question Available"}
                </CardTitle>
                {question?.difficulty && (
                  <span
                    className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                      question.difficulty === "Easy"
                        ? "bg-emerald-500 text-white"
                        : question.difficulty === "Medium"
                        ? "bg-amber-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {question.difficulty}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto pr-10 pl-6 py-6 bg-white my-0">
              <div className="space-y-6">
                {/* Question Content */}
                <div className="question-content">
                  {question?.content ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none \
                                prose-headings:text-slate-200 prose-p:text-slate-300 \
                                prose-strong:text-white prose-code:bg-slate-700/50 \
                                prose-code:text-emerald-400 prose-code:px-1 prose-code:py-0.5 \
                                prose-code:rounded prose-pre:bg-slate-900/50 \
                                prose-pre:border prose-pre:border-slate-600/30"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                  ) : (
                    <p className="text-slate-400 text-center py-8 italic">
                      No question content available
                    </p>
                  )}
                </div>

                {/* Tags */}
                {question?.tags && question.tags.length > 0 && (
                  <div className="border-t border-slate-600/30 pt-4">
                    <p className="text-sm text-slate-400 mb-3 font-medium">
                      Tags:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-600/80 hover:bg-blue-500/80 text-white px-3 py-1 \
                                   rounded-full text-xs font-medium transition-colors duration-200 \
                                   shadow-sm border border-blue-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="w-3/5 min-h-0 flex flex-col p-6 pl-3">
        <div className="h-full bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-600/50 overflow-hidden">
          <div className="relative flex h-full min-h-0">
            <div className="flex-1 min-w-0">
              <CodeEditor
                sessionId={roomId}
                question={question}
                showHeader={true}
              />
            </div>
            {/* Chat overlays the editor instead of shifting layout */}
            <ChatWrapper sessionId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingChatButton({ onClick }: { onClick: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const node = (
    <div className="fixed bottom-10 right-15 z-[9999] pointer-events-auto">
      <button
        aria-label="Open chat"
        onClick={onClick}
        className="w-12 h-12 rounded-full bg-slate-700/80 text-white flex items-center justify-center shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          aria-hidden
        >
          <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm8 4H6v-2h8v2zm2-6H6V5h10v2z" />
        </svg>
      </button>
    </div>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}

function ChatWrapper({ sessionId }: { sessionId: string }) {
  // Start with chat collapsed/closed by default
  const [collapsed, setCollapsed] = useState(true);
  // When collapsed, show only a floating chat button in the bottom-right
  // corner. When expanded, render the chat overlay as before.
  if (collapsed) {
    return <FloatingChatButton onClick={() => setCollapsed(false)} />;
  }

  // expanded overlay
  const baseClass = "hidden md:block";
  const overlayClasses = "md:absolute md:right-0 md:top-17 md:bottom-0 md:z-50 h-full";
  const widthClass = "md:w-80";

  return (
    // Make overlay container non-intercepting so wheel events fall through
    // to the editor when the pointer is not over the chat panel itself.
    <div className={`${baseClass} ${overlayClasses} ${widthClass} pointer-events-none`}>
      <div className="pointer-events-auto h-full">
        <ChatPanel
          sessionId={sessionId}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>
    </div>
  );
}
