"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import { useRealtime } from "../contexts/realtime-context";

interface EndSessionButtonProps extends ButtonProps {
  sessionId: string;
}
const baseApiUrl = "/api/collaboration-service";

export default function EndSessionButton({
  sessionId,
  ...props
}: EndSessionButtonProps) {
  const { endSession } = useRealtime();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showError, setShowError] = React.useState<string | null>(null);

  const handleEndSession = async () => {
    // open confirmation modal
    setShowConfirm(true);
  };

  const doEndSession = async () => {
    setIsLoading(true);
    try {
      // update db
      await axiosInstance.patch(`${baseApiUrl}/sessions/${sessionId}/complete`);
      // Broadcast locally via context if available (when header is inside provider).
      try {
        if (typeof endSession === "function") endSession();
      } catch (e) {
        // ignore if provider not present
      }
      // Also dispatch a global event that the CodeEditor (which owns the realtime
      // channel) listens to. This handles the case where the header is rendered
      // outside of the realtime provider.
      try {
        window.dispatchEvent(
          new CustomEvent("peerprep:end_session", { detail: { sessionId } })
        );
      } catch (e) {
        // ignore
      }
      // close modal on success
      setShowConfirm(false);
    } catch (err) {
      console.error("Failed to end session:", err);
      setShowConfirm(false);
      setShowError("Failed to end session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={handleEndSession}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? "Ending..." : "End Session"}
      </Button>

      <EndSessionModalContainer
        sessionId={sessionId}
        showConfirm={showConfirm}
        setShowConfirm={setShowConfirm}
        showError={showError}
        setShowError={setShowError}
        isLoading={isLoading}
        doEndSession={doEndSession}
      />
    </>
  );
}

// Render confirmation / error modals alongside the button so callers that
// import this component get the modal UI automatically.
export function EndSessionModalContainer({
  sessionId,
  showConfirm,
  setShowConfirm,
  showError,
  setShowError,
  isLoading,
  doEndSession,
}: {
  sessionId: string;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  showError: string | null;
  setShowError: (v: string | null) => void;
  isLoading: boolean;
  doEndSession: () => Promise<void>;
}) {
  return (
    <>
      {showConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white text-black rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 z-50">
            <h3 className="text-lg font-semibold mb-2 text-black">
              End collaboration session?
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Are you sure you want to end this session for all participants?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void doEndSession()}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Ending..." : "End Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="alertdialog">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white text-black rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 z-50">
            <h3 className="text-lg font-semibold mb-2 text-black">Error</h3>
            <p className="text-sm text-slate-700 mb-4">{showError}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowError(null)}
                className="px-3 py-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

