"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useUser } from "@/contexts/user-context";
import api from "@/lib/axios";

interface SoloPracticeButtonProps extends ButtonProps {
  intervieweeId?: string;
  onRequireLogin?: () => void;
}

export default function SoloPracticeButton({
  intervieweeId,
  onRequireLogin,
  ...props
}: SoloPracticeButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSoloPractice = async () => {
    if (!user) {
      onRequireLogin?.();
      return;
    }
    setIsLoading(true);

    try {
      const res = await api.post("/api/collaboration-service/sessions", {
        interviewee_id: user.id,
      });

      const sessionId = res?.data?.id;

      if (!sessionId) {
        console.error("No session_id returned from backend");
        return;
      }

      router.push(`/room/${sessionId}`);
    } catch (err) {
      console.error("Failed to create solo session:", err);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSoloPractice} disabled={isLoading} {...props}>
      {isLoading ? "Starting..." : "Solo Practice"}
    </Button>
  );
}
