/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and modofied behvaiour of a couple fo test cases for clarity
*/
import React from "react";
import EndSessionButton from "./EndSessionBtn";

function CodeEditorHeader({
  sessionId,
  peerUsername,
  ownUsername,
  isBlocked,
}: {
  sessionId: string;
  peerUsername?: string | null;
  ownUsername?: string | null;
  isBlocked: boolean;
}) {
  const own = ownUsername ? `${ownUsername} (You)` : "You";
  const peer = peerUsername || null;
  return (
    <div className="w-full flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="text-sm text-slate-300 truncate min-w-0">
          <span className="block truncate">
            Room: <span className="font-medium text-blue-400">{sessionId}</span>
          </span>
        </div>
        <div className="text-sm text-slate-300 truncate min-w-0">
          <span className="block truncate">
            Online: <span className="font-medium text-emerald-400">{own}</span>
            {peer ? ", " : ""}
            {peer ? (
              <span className="font-medium text-emerald-400">{peer}</span>
            ) : null}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${isBlocked ? "bg-amber-500" : "bg-emerald-500"
              }`}
          />
          <span
            className={`text-xs font-medium ${isBlocked ? "text-amber-400" : "text-emerald-400"
              } max-w-[8rem] truncate block`}
          >
            {isBlocked ? "Read-only" : "Collaborative"}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0">
        <EndSessionButton sessionId={sessionId} />
      </div>
    </div>
  );
}

export default CodeEditorHeader;
