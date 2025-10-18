"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Code2,
  Timer as TimerIcon,
  Shuffle,
  X,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreferenceModal } from "./components/PreferenceModal";
import { useUser } from "@/contexts/user-context";

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [prefs, setPrefs] = useState<{
    topics: string[];
    difficulty: "easy" | "medium" | "hard";
  } | null>(null);
  const [openPrefs, setOpenPrefs] = useState(false);
  const { user } = useUser();
  const userId = user?.id;

  // State for Alert
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    variant: "default" | "destructive";
  } | null>(null);

  // Start/stop timer and manage WebSocket connection
  useEffect(() => {
    if (isMatching && userId) {
      if (!prefs) {
        setAlertInfo({
          message: "Please set your preferences before starting matching.",
          variant: "destructive",
        });
        setIsMatching(false);
        return;
      }

      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      const wsUrl = `ws://localhost:6006/ws/matching/${encodeURIComponent(
        userId
      )}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection established.");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received message:", message);

          if (message.type === "MATCH_FOUND") {
            console.log("Match found! Redirecting...");
            setIsMatching(false);
            router.push(message.payload.collaborationUrl);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setAlertInfo({
          message: "A connection error occurred. Please try again.",
          variant: "destructive",
        });
        setIsMatching(false);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed.");
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [isMatching, userId, prefs, router]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const secs = (elapsed % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [elapsed]);

  async function addToQueue(userId: string) {
    const res = await fetch(
      `http://localhost:8000/api/matching-service/queue/${encodeURIComponent(
        userId
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) {
      const msg = await safeErrMsg(res);
      throw new Error(msg || "Failed to start matching.");
    }
    return res.json().catch(() => ({}));
  }

  async function removeFromQueue(userId: string) {
    const res = await fetch(
      `http://localhost:8000/api/matching-service/queue/${encodeURIComponent(
        userId
      )}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) {
      const msg = await safeErrMsg(res);
      throw new Error(msg || "Failed to cancel matching.");
    }
    return res.json().catch(() => ({}));
  }

  async function safeErrMsg(res: Response) {
    try {
      const data = await res.json();
      return data?.error || data?.message;
    } catch {
      return res.statusText;
    }
  }

  const handleToggleMatching = async () => {
    if (isSubmitting || !userId) return;
    setAlertInfo(null); // <-- Clear previous alerts on new action
    setIsSubmitting(true);

    try {
      if (!isMatching) {
        await addToQueue(userId);
        setIsMatching(true);
      } else {
        await removeFromQueue(userId);
        setIsMatching(false);
        setElapsed(0);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setAlertInfo({
        message: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <nav className="border-b border-blue-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Code2 className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">
                CodeCollab
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/features"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/support"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 flex-col justify-center px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <section>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setOpenPrefs(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-70 transition-colors"
                disabled={isMatching}
              >
                Preferences
              </button>
            </div>

            {/* --- Alert Rendering Logic --- */}
            {alertInfo && (
              <Alert variant={alertInfo.variant} className="mb-4 relative">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {alertInfo.variant === "destructive" ? "Error" : "Notice"}
                </AlertTitle>
                <AlertDescription>{alertInfo.message}</AlertDescription>
                <button
                  onClick={() => setAlertInfo(null)}
                  className="absolute top-2 right-2 p-1 rounded-md text-current/70 hover:text-current"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            )}
            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-blue-600/20 p-2">
                      <TimerIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">Live Matching</CardTitle>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isMatching ? "text-cyan-300" : "text-blue-300"
                    }`}
                  >
                    {isMatching ? "Searching..." : "Idle"}
                  </span>
                </div>
                {/* Preferences Button inside Live Matching header */}
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-200 mb-6">
                  {isMatching
                    ? "We’re looking for a collaborator that fits your preferences. Hang tight!"
                    : "Click the button below to start matching."}
                </CardDescription>

                {isMatching && (
                  <div className="mb-8 flex items-center justify-center">
                    <div className="inline-flex items-center rounded-xl border border-blue-800/40 bg-slate-900/50 px-6 py-3">
                      <TimerIcon className="mr-3 h-5 w-5 text-cyan-300" />
                      <span className="text-3xl font-mono font-semibold text-white tabular-nums">
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  {isMatching ? (
                    <Button
                      size="lg"
                      className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 text-lg"
                      onClick={handleToggleMatching}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-5 w-5" />
                      Cancel Matching
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                      onClick={handleToggleMatching}
                      disabled={isSubmitting}
                    >
                      <Shuffle className="mr-2 h-5 w-5" />
                      Start Matching
                    </Button>
                  )}
                </div>

                <p className="mt-6 text-center text-sm text-blue-300">
                  You can leave this page open; we’ll keep searching until you
                  cancel.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <footer className="mt-auto border-t border-blue-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center">
              <Code2 className="h-6 w-6 text-blue-400" />
              <span className="ml-2 text-lg font-semibold text-white">
                CodeCollab
              </span>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-blue-300">
            <p>&copy; 2025 CodeCollab. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <PreferenceModal
        userId={userId ?? ""}
        open={openPrefs}
        onClose={() => setOpenPrefs(false)}
        onSaved={(data) =>
          setPrefs({ topics: data.topics, difficulty: data.difficulty })
        }
      />
    </div>
  );
}
