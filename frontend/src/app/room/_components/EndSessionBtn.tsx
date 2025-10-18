"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";

interface EndSessionButtonProps extends ButtonProps {
  sessionId: string;
}
const baseApiUrl = "/api/collaboration-service";

export default function EndSessionButton({
  sessionId,
  ...props
}: EndSessionButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleEndSession = async () => {
    const confirmEnd = confirm("Are you sure you want to end this session?");
    if (!confirmEnd) return;

    try {
      setIsLoading(true);

      // ✅ Inform backend to mark session as ended
      await axiosInstance.patch(`${baseApiUrl}/sessions/${sessionId}/complete`);

      router.push("/"); // todo move to sesion history
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
