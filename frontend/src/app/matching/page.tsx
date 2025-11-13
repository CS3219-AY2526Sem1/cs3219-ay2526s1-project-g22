/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-25
Scope: Reviewed the code and identified a few potential bugs, then suggested small fixes.
Author review: I verified correctness of the modifications by AI against requirements. I resolved small issues, debugged UI interactions, and verified changes locally.
*/
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Code2,
  Timer as TimerIcon,
  Shuffle,
  X,
  AlertCircle,
  ArrowLeft,
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
import Header from "@/app/_components/Header";
import { createClient } from "@/lib/supabase/supabase-client";
import axiosInstance from "@/lib/axios";

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
  const [proposal, setProposal] = useState<{
    proposalId: string;
    opponentRejectionRate: number;
  } | null>(null);
  const [matchAccepted, setMatchAccepted] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await axiosInstance.post(
          "/api/collaboration-service/sessions/getActiveSession"
        );

        const id =
          typeof res.data === "string" ? res.data : res.data?.id || null;

        if (id) {
          setActiveSession({ id });
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        console.error("Failed to fetch active session:", err);
        setActiveSession(null);
      }
    }

    if (userId) checkActiveSession();
  }, [userId]);

  // State for Alert
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    variant: "default" | "destructive";
  } | null>(null);

  // Start/stop timer
  useEffect(() => {
    if (isMatching && userId) {
      setElapsed(0);
      const timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      intervalRef.current = timer;

      return () => {
        clearInterval(timer);
        intervalRef.current = null;
      };
    }
  }, [isMatching]);

  // Manage WebSocket connection
  useEffect(() => {
    const socketIsNeeded = (isMatching || proposal) && userId;

    if (socketIsNeeded && !wsRef.current) {
      const wsApiUrl = process.env
        .NEXT_PUBLIC_API_URL!.replace(/^http(s?)/, "ws$1")
        .replace(/\/$/, "");
      const wsUrl = `${wsApiUrl}/api/matching-service/ws/matching/${encodeURIComponent(
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

          if (message.type === "MATCH_PROPOSED") {
            setProposal(message.payload);
            setMatchAccepted(false);
            setIsMatching(false);
          }

          if (message.type === "PROPOSAL_REJECTED") {
            setProposal(null);
            setAlertInfo({
              message:
                "Your partner declined the match. You can start a new search.",
              variant: "default",
            });
          }

          if (message.type === "MATCH_FOUND") {
            console.log("Match found! Redirecting...");
            setProposal(null);
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
        wsRef.current = null;
      };
    } else if (!socketIsNeeded && wsRef.current) {
      wsRef.current.close();
    }
  }, [isMatching, proposal, userId, router]);

  // Closes websocket on component unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const secs = (elapsed % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [elapsed]);

  async function addToQueue(userId: string) {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/matching-service/queue/${encodeURIComponent(userId)}`,
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
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/matching-service/queue/${encodeURIComponent(userId)}`,
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
    if (!prefs) {
      setAlertInfo({
        message: "Please set your preferences before starting matching.",
        variant: "destructive",
      });
      setIsMatching(false);
      return;
    }

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

  const handleAccept = async () => {
    if (isSubmitting || !proposal) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User not authenticated.");
      }

      const token = session.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/matching-service/proposals/${proposal.proposalId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Failed to accept match." }));
        throw new Error(errorData.message);
      }

      // Show a "Waiting for partner..." message
      // setProposal(null); // Clear proposal
      setAlertInfo({
        message: "Match accepted! Waiting for your partner...",
        variant: "default",
      });
      setMatchAccepted(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setAlertInfo({ message: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting || !proposal) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User not authenticated.");
      }

      const token = session.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/matching-service/proposals/${proposal.proposalId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Failed to reject match." }));
        throw new Error(errorData.message);
      }

      // User is not put back in queue automatically.
      setProposal(null);
      setAlertInfo({
        message: "Match rejected. You can start a new search.",
        variant: "default",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setAlertInfo({ message: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejoin = async () => {
    if (isSubmitting || !activeSession?.id) return;
    setIsSubmitting(true);

    try {
      // check the current session status
      const res = await axiosInstance.get(
        `/api/collaboration-service/sessions/${activeSession.id}`
      );

      const session = res?.data;
      if (!session) {
        setAlertInfo({
          message: "Unable to find session information.",
          variant: "destructive",
        });
        setActiveSession(null);
        return;
      }

      if (session.status === "completed") {
        // hide the button and notify user
        setActiveSession(null);
        setAlertInfo({
          message: "This session has already been completed.",
          variant: "default",
        });
        return;
      }

      // navigate to the session room
      await router.push(`/room/${activeSession.id}`);
    } catch (err) {
      console.error("Failed to rejoin session:", err);
      setAlertInfo({
        message: "Failed to rejoin session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      <Header />
      <main className="flex flex-1 flex-col justify-center px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <section>
            {!proposal && (
              <div className="mb-4 flex justify-between">
                <button
                  onClick={() => router.back()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={() => setOpenPrefs(true)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-70 transition-colors"
                  disabled={isMatching}
                >
                  Preferences
                </button>
              </div>
            )}

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

            {proposal ? (
              <Card className="bg-green-800/50 border-green-700/30 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-full bg-green-600/20 p-2">
                        <TimerIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <CardTitle className="text-white">
                        Match Proposal
                      </CardTitle>
                    </div>
                    <span className="text-sm font-medium text-green-300">
                      Action Required
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-8 flex h-[104px] items-center justify-center">
                    <p className="text-center text-lg text-green-200">
                      Your potential partner is rejected in{" "}
                      {Math.round((proposal.opponentRejectionRate || 0) * 100)}%
                      of their matches.
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                      onClick={handleAccept}
                      disabled={isSubmitting || matchAccepted}
                    >
                      Accept
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="px-8 py-6 text-lg"
                      onClick={handleReject}
                      disabled={isSubmitting || matchAccepted}
                    >
                      Reject
                    </Button>
                  </div>

                  <p className="mt-6 text-center text-sm text-green-300">
                    If you reject, you can start a new search.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-full bg-blue-600/20 p-2">
                        <TimerIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-white">
                        Live Matching
                      </CardTitle>
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

                  <div className="flex justify-center gap-4">
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
                      <>
                        {activeSession ? (
                          <Button
                            size="lg"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg"
                            onClick={handleRejoin}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Shuffle className="mr-2 h-5 w-5 animate-spin" />
                                Rejoining...
                              </>
                            ) : (
                              "Rejoin Session"
                            )}
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
                      </>
                    )}
                  </div>

                  <p className="mt-6 text-center text-sm text-blue-300">
                    You can leave this page open; we’ll keep searching until you
                    cancel.
                  </p>
                </CardContent>
              </Card>
            )}
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
