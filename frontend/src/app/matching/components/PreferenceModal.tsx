/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-25
Scope: Reviewed the code and identified a few potential bugs, then suggested small fixes.
Author review: I verified correctness of the modifications by AI against requirements. I resolved small issues, debugged UI interactions, and verified changes locally.
*/
"use client";

import { useEffect, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";

type Preferences = {
  userId: string;
  topics: string[];
  difficulty: Difficulty;
};

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (prefs: Preferences) => void;
};

export function PreferenceModal({ userId, open, onClose, onSaved }: Props) {
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (open) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open, onClose]);

  // Load *available* topics from the question service
  useEffect(() => {
    let ignore = false;
    async function loadAvailableTopics() {
      if (!open) return;
      setTopicsLoading(true);
      setTopicsError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/question-service/questions/topics`
        );
        if (!res.ok) {
          throw new Error(`Failed to load topics list (${res.status})`);
        }
        const data: string[] = await res.json();
        if (!ignore) {
          setAvailableTopics(data);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error("Load topics error", e);
        if (!ignore) setTopicsError(e?.message ?? "Failed to load topics list");
      } finally {
        if (!ignore) setTopicsLoading(false);
      }
    }
    loadAvailableTopics();
    return () => {
      ignore = true;
    };
  }, [open]);

  // Load *existing user preferences* on open
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!open || !userId) return;
      setPrefsLoading(true);
      setError(null);
      try {
        console.log("load start", { open, userId });
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/matching-service/preferences/${encodeURIComponent(userId)}`
        );
        console.log("load status", res.status);
        if (res.status === 404) {
          if (!ignore) {
            setTopics([]);
            setDifficulty("medium");
          }
        } else if (!res.ok) {
          throw new Error(`Failed to load preferences (${res.status})`);
        } else {
          const data: Preferences = await res.json();
          console.log("load data", data);
          if (!ignore) {
            setTopics(data.topics);
            setDifficulty(data.difficulty);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error("Load error", e);
        if (!ignore) setError(e?.message ?? "Failed to load preferences");
      } finally {
        if (!ignore) setPrefsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [open, userId]);

  const canSave =
    topics.length > 0 &&
    (difficulty === "easy" || difficulty === "medium" || difficulty === "hard");

  async function handleSave() {
    console.log("handleSave", { canSave, saving, topics, difficulty });
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/matching-service/preferences/${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics, difficulty }),
        }
      );
      if (!res.ok) {
        if (res.status === 400) {
          const msg = await res.text();
          throw new Error(msg || "Validation error");
        }
        throw new Error(`Failed to save preferences (${res.status})`);
      }
      const data: Preferences = await res.json();
      onSaved?.(data);
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message ?? "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  function handleTopicToggle(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  if (!open) return null;

  const difficultyColors = {
    easy: {
      selected: "bg-green-600 text-white border-green-500",
      unselected:
        "bg-slate-900/50 text-green-300 border-green-800/40 hover:bg-slate-800/50",
    },
    medium: {
      selected: "bg-orange-600 text-white border-orange-500",
      unselected:
        "bg-slate-900/50 text-orange-300 border-orange-800/40 hover:bg-slate-800/50",
    },
    hard: {
      selected: "bg-red-600 text-white border-red-500",
      unselected:
        "bg-slate-900/50 text-red-300 border-red-800/40 hover:bg-slate-800/50",
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pref-title"
      aria-describedby="pref-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-lg border border-blue-800/40 bg-slate-900 p-5 shadow-xl"
      >
        <div className="mb-4">
          <h2
            id="pref-title"
            className="text-lg font-semibold text-white tracking-tight"
          >
            Match Preferences
          </h2>
          <p id="pref-desc" className="mt-1 text-sm text-blue-300">
            Choose topics and difficulty to improve your matches.
          </p>
        </div>

        {prefsLoading ? (
          <div className="text-sm text-blue-300">Loading preferences…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-blue-200">
                  Topics
                </label>
              </div>

              {/* === TOPIC SELECTION UI === */}
              {topicsLoading ? (
                <div className="text-sm text-blue-300">Loading topics...</div>
              ) : topicsError ? (
                <div className="text-sm text-rose-300">{topicsError}</div>
              ) : (
                <div
                  id="topics-container"
                  className={[
                    "flex flex-wrap gap-2 overflow-y-auto pr-2 transition-all duration-300 pretty-scrollbar max-h-40",
                  ].join(" ")}
                >
                  {availableTopics.map((topic) => {
                    const isSelected = topics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleTopicToggle(topic)}
                        className={[
                          "rounded-full px-3 py-1 text-sm font-medium border transition-colors",
                          isSelected
                            ? "bg-green-700 text-white border-green-500"
                            : "bg-slate-900/50 text-blue-300 border-blue-800/40 hover:bg-slate-800/50",
                        ].join(" ")}
                        aria-pressed={isSelected}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((lvl) => {
                  const colors = difficultyColors[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={[
                        "rounded-md px-3 py-2 text-sm font-medium border transition-colors",
                        difficulty === lvl
                          ? colors.selected
                          : colors.unselected,
                      ].join(" ")}
                      aria-pressed={difficulty === lvl}
                    >
                      {lvl[0].toUpperCase() + lvl.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-300 bg-rose-900/20 border border-rose-800/40 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-blue-800/40 bg-slate-900/50 px-4 py-2 text-sm text-blue-200 hover:bg-slate-800/50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving || prefsLoading || topicsLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
