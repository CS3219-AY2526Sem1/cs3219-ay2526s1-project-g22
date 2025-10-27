"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/user-context";
import useChat from "../hooks/useChat";

type Props = {
  sessionId: string;
};

type ChatPanelProps = {
  sessionId: string;
  collapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
};

export default function ChatPanel({
  sessionId,
  collapsed = false,
  setCollapsed,
}: ChatPanelProps) {
  const { user } = useUser();
  const [internalCollapsed, setInternalCollapsed] =
    useState<boolean>(collapsed);
  const isCollapsed = setCollapsed ? collapsed : internalCollapsed;
  const applyCollapsed = (v: boolean) => {
    if (setCollapsed) setCollapsed(v);
    else setInternalCollapsed(v);
  };
  const userId = user?.id;
  const { messages, sendMessage, isSending, error, refresh } =
    useChat(sessionId);
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;
      atBottomRef.current = atBottom;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // auto-scroll to bottom when new messages arrive if at bottom
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const onSend = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    try {
      await sendMessage({ content: trimmed });
      // optimistic refresh
      setTimeout(() => refresh(), 300);
    } catch (e) {
      console.error(e);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full flex items-center justify-center">
        <button
          aria-label="Open chat"
          className="w-10 h-10 rounded-full bg-slate-700/60 text-white flex items-center justify-center"
          onClick={() => applyCollapsed(false)}
        >
          {/* Inline chat bubble SVG - keeps styling self-contained */}
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
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/70 border-l border-slate-600/40 rounded-r-md">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-600/30">
        <div className="text-sm font-semibold text-white">Chat</div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-slate-300 hover:text-white"
            onClick={() => applyCollapsed(true)}
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-3" ref={listRef}>
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words break-all overflow-hidden ${
                  mine ? "bg-blue-600 text-white" : "bg-slate-700/80 text-white"
                }`}
              >
                <div className="text-xs text-slate-200 opacity-80 mb-1">
                  {mine ? "You" : m.sender_id}
                </div>
                <div>{m.content}</div>
                <div className="text-xs text-slate-300 opacity-70 mt-1 text-right">
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-sm text-slate-400 text-center mt-8">
            No messages yet
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-600/30 bg-slate-800/80 sticky bottom-0 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            className="flex-1 resize-none rounded-md bg-slate-700/60 text-white px-3 py-2 text-sm focus:outline-none"
            placeholder="Type a message..."
          />
          <button
            onClick={onSend}
            disabled={isSending}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
        {Boolean(error) && (
          <div className="text-xs text-red-400 mt-1">{String(error)}</div>
        )}
      </div>
    </div>
  );
}
