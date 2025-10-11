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
import { EditorView, keymap } from "@codemirror/view";
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
import EndSessionButton from "./EndSessionBtn";
import axiosInstance from "@/lib/axios";

const baseApiUrl = "/api/collaboration-service";
type Props = {
  sessionId: string;
};

export default function CodeEditor({ sessionId }: Props) {
  const { user } = useUser();
  const userId = user?.id;

  const [code, setCode] = useState<string>("// Loading session...\n");
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("Initializing...");
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

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
        setStatusMsg(`Error: ${e.message || e}`);
      }
    }
    initSession();
    return () => {
      aborted = true;
    };
  }, []);

  // Join Supabase channel
  const joinRealtimeChannel = useCallback(
    async (initialCode: string) => {
      const channel = supabase.channel(`room-${sessionId}`, {
        config: { presence: { key: userId } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setConnectedUsers(Object.keys(state || {}));
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
    [supabase, sessionId, userId, baseApiUrl]
  );

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
    []
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

  const extensions = useMemo(
    () => [
      javascript({ jsx: true, typescript: true }),
      EditorView.lineWrapping,
      EditorView.editable.of(!isBlocked),
      keymap.of([]),
    ],
    [isBlocked]
  );

  return (
    <>
      <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
        <div>
          Room: <span className="font-medium text-gray-600">{sessionId}</span> •
          User: <span className="font-medium text-gray-600">{userId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              isBlocked
                ? "text-yellow-600 font-medium"
                : "text-green-600 font-medium"
            }
          >
            {isBlocked ? "Read-only" : "Editable"}
          </span>
          <EndSessionButton sessionId={sessionId} />
        </div>
      </div>

      <div className="border rounded-md p-2">
        <CodeMirror
          value={code}
          height="90vh"
          theme="dark"
          extensions={extensions}
          onChange={onChange}
          basicSetup={{ lineNumbers: true }}
        />
      </div>
    </>
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
