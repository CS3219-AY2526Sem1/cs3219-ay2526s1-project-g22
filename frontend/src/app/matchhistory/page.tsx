/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 2025-10-28
Scope: Reviewed the code, caught a few potential bugs, and suggested improvements to avoid them.
Author review: I verified correctness of the modifications by AI against requirements. I fixed minor issues, checked display logic, and ran sample checks to confirm correctness.
*/
"use client";

import Header from "@/app/_components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/contexts/user-context";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Code2,
  History,
  Loader2,
  User,
  X,
  AlertTriangle,
  Timer,
  TimerIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// --- Type Definitions ---

// Type for the raw API response
interface ApiMatch {
  matchId: string;
  sessionId: string;
  role: string;
  status: "completed" | "active" | string;
  oppositeName: string;
}

// Type for the data structure used by the UI
interface DisplayMatch {
  id: string;
  partnerName: string;
  outcome: "completed" | "active" | string;
  role: string;
}

// --- API Fetching Function ---
async function fetchMatchHistory(userId: string): Promise<DisplayMatch[]> {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/matching-service/history/${encodeURIComponent(userId)}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch match history");
  }

  const data: ApiMatch[] = await res.json();

  return data.map((match) => ({
    id: match.matchId,
    partnerName: match.oppositeName,
    outcome: match.status,
    role: match.role,
  }));
}

export default function MatchHistoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we have a user ID
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Use an async IIFE (Immediately Invoked Function Expression) inside useEffect
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedMatches = await fetchMatchHistory(user.id);
        setMatches(fetchedMatches);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id]); // re-run if user.id changes

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="ml-2 text-blue-200">Loading history...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center py-12 bg-rose-900/30 text-rose-300 rounded-lg border border-rose-700/50">
          <AlertTriangle className="h-8 w-8" />
          <p className="mt-2 font-medium">Failed to load history</p>
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <p className="text-center text-blue-300 py-8">
          You have no match history yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900/50 p-4 rounded-lg border border-blue-800/30"
          >
            {/* Match Details */}
            <div className="flex-1 mb-3 sm:mb-0">
              <div className="flex items-start space-x-3">
                <User className="h-4 w-4 text-blue-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white font-medium truncate">
                    {match.partnerName}
                  </p>
                </div>

                {match.role === "interviewer" ? (
                  <div className="inline-flex items-center space-x-1.5 rounded-full bg-orange-900/50 text-orange-300 px-3 py-1 text-sm font-medium border border-green-700/50">
                    <span className="font-medium text-orange">
                      {match.role}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 rounded-full bg-purple-900/50 text-purple-300 px-3 py-1 text-sm font-medium border border-green-700/50">
                    <span className="font-medium text-purple-400">
                      {match.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* --- MODIFICATION END --- */}

            {/* Match Outcome */}
            <div className="flex-shrink-0">
              {match.outcome === "completed" ? (
                <div className="inline-flex items-center space-x-1.5 rounded-full bg-green-900/50 text-green-300 px-3 py-1 text-sm font-medium border border-green-700/50">
                  <Check className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 rounded-full bg-yellow-900/50 text-yellow-300 px-3 py-1 text-sm font-medium border border-yellow-700/50">
                  <TimerIcon className="h-4 w-4" />
                  <span>
                    {match.outcome.charAt(0).toUpperCase() +
                      match.outcome.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
      <Header />
      <main className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl w-full">
          <section>
            <div className="mb-4 flex justify-between">
              <button
                onClick={() => router.back()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </div>

            <Card className="bg-slate-800/50 border-blue-800/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-blue-600/20 p-2">
                      <History className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-white">Match History</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-blue-200 mb-6">
                  A log of your past collaboration sessions.
                </CardDescription>
                {renderContent()}
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
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-blue-200 hover:text-white transition-colors"
              >
                Support
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-blue-300">
            <p>&copy; 2025 CodeCollab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
