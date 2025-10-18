"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topicsInput, setTopicsInput] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Basic focus handling when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFieldRef.current?.focus(), 0);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open, onClose]);

  // Load existing preferences on open
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!open || !userId) return;
      setInitialLoading(true);
      setError(null);
      try {
        console.log("load start", { open, userId });
        const res = await fetch(
          `http://localhost:8000/api/matching-service/preferences/${encodeURIComponent(
            userId
          )}`
        );
        console.log("load status", res.status);
        if (res.status === 404) {
          if (!ignore) {
            setTopicsInput("");
            setDifficulty("medium");
          }
        } else if (!res.ok) {
          throw new Error(`Failed to load preferences (${res.status})`);
        } else {
          const data: Preferences = await res.json();
          console.log("load data", data);
          if (!ignore) {
            setTopicsInput(data.topics.join(", "));
            setDifficulty(data.difficulty);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        // Explicitly type e as 'any' or 'Error'
        console.error("Load error", e);
        if (!ignore) setError(e?.message ?? "Failed to load preferences");
      } finally {
        if (!ignore) setInitialLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [open, userId]);

  const topics = useMemo(
    () =>
      topicsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    [topicsInput]
  );

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
        `http://localhost:8000/api/matching-service/preferences/${encodeURIComponent(
          userId
        )}`,
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
      // Explicitly type e as 'any' or 'Error'
      setError(e?.message ?? "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // Define color classes for each difficulty level
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

        {initialLoading ? (
          <div className="text-sm text-blue-300">Loading preferences…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Topics
              </label>
              <input
                ref={firstFieldRef}
                type="text"
                className="w-full rounded-md border border-blue-800/40 bg-slate-900/50 px-3 py-2 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., React, TypeScript, Algorithms"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
              />
              <p className="mt-1 text-xs text-blue-300">
                Comma-separated. Example: React, TypeScript, SQL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
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
            disabled={!canSave || saving || initialLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
