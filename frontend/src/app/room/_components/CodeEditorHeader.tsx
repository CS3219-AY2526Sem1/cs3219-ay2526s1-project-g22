import React from "react";
import EndSessionButton from "./EndSessionBtn";

function CodeEditorHeader({
  sessionId,
  userId,
  isBlocked,
}: {
  sessionId: string;
  userId: string;
  isBlocked: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-300">
          Room: <span className="font-medium text-blue-400">{sessionId}</span>
        </div>
        <div className="text-sm text-slate-300">
          User: <span className="font-medium text-emerald-400">{userId}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isBlocked ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isBlocked ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {isBlocked ? "Read-only" : "Collaborative"}
          </span>
        </div>
      </div>
      <EndSessionButton sessionId={sessionId} />
    </>
  );
}

export default CodeEditorHeader;
