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

  const handleEndSession = async () => {
    const confirmEnd = confirm("End session for all users?");
    if (!confirmEnd) return;

    try {
      setIsLoading(true);
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
    } catch (err) {
      console.error("Failed to end session:", err);
      alert("Failed to end session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleEndSession}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Ending..." : "End Session"}
    </Button>
  );
}
