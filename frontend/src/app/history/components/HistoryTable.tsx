/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-11-02
Scope: Assisted with implementing parts of the request logic and caught a few small issues
Author review: I verified correctness of the modifications by AI against requirements .
*/
"use client";
import { HistoryData } from "../types/HistoryData";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/supabase-client";
import ReactMarkdown from "react-markdown";

interface HistoryTableProps {
  data: HistoryData[];
}

// Helper component for Difficulty badges
const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const baseClasses =
    "inline-block text-xs font-semibold px-2 py-1 rounded-full text-white";
  let colorClasses: string;

  switch (difficulty) {
    case "Easy":
      colorClasses = "bg-green-500/80";
      break;
    case "Medium":
      colorClasses = "bg-amber-500/80";
      break;
    case "Hard":
      colorClasses = "bg-red-500/80";
      break;
    default:
      colorClasses = "bg-gray-500";
  }

  return <span className={cn(baseClasses, colorClasses)}>{difficulty}</span>;
};

async function safeErrMsg(res: Response) {
  try {
    const data = await res.json();
    return data?.error || data?.message;
  } catch {
    return res.statusText;
  }
}

// Function for AI button click
const handleButtonClick = async (code: string) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated.");
  }

  const token = session.access_token;

  // send code to AI API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/ai-service/chat/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: `Provide a concise summary of the following code:\n\n${code}`,
      }),
    }
  );

  if (!res.ok) {
    const msg = await safeErrMsg(res);
    throw new Error(msg || "Failed to retrieve AI summary.");
  }

  return res.json().catch(() => ({}));
};

export default function HistoryTable({ data }: HistoryTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "difficulty">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const allTags = Array.from(
    new Set(data.flatMap((d) => d.question?.tags || []))
  );

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  const filteredData = data.filter((item) => {
    const query = search.toLowerCase();
    const interviewerName = (
      item.interviewer?.name || "Solo-Practice"
    ).toLowerCase();
    const intervieweeName = (item.interviewee?.name || "").toLowerCase();
    const questionTitle = (item.question?.title || "").toLowerCase();
    const tags = item.question?.tags || [];

    const matchesSearch =
      interviewerName.includes(query) ||
      intervieweeName.includes(query) ||
      questionTitle.includes(query);

    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((t) => tags.includes(t));

    return matchesSearch && matchesTags;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortKey === "difficulty") {
      const order: { [key: string]: number } = { Easy: 1, Medium: 2, Hard: 3 };
      const aDiff = a.question?.difficulty ?? "";
      const bDiff = b.question?.difficulty ?? "";
      const aOrder = order[aDiff] ?? 0;
      const bOrder = order[bDiff] ?? 0;
      return sortAsc ? aOrder - bOrder : bOrder - aOrder;
    }
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return sortAsc ? aDate - bDate : bDate - aDate;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="max-w-11/12 mx-auto bg-slate-900 rounded-lg border border-slate-600 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-blue-800/30">
        <h2 className="text-xl font-bold text-blue-400 mb-2 sm:mb-0">
          Interview History
        </h2>
        <Input
          placeholder="Search interviewer, interviewee, or question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-slate-800 border-blue-700/50 text-white placeholder-blue-300/70 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tag Filters Section */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 border-b border-blue-800/30">
          <span className="text-sm font-medium text-blue-200 mr-2">
            Filters:
          </span>
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs rounded-full px-3 py-1 border transition-colors font-medium",
                  active
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-slate-700 text-blue-200 border-blue-700/50 hover:bg-slate-600"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Section */}
      <div className="min-h-[400px] transition-all overflow-x-auto">
        <Table className="bg-slate-900">
          {" "}
          {/* Ensure Table body is dark */}
          <TableHeader>
            <TableRow className="bg-slate-800/70 border-b border-blue-800/30 hover:bg-slate-800/70">
              <TableHead className="text-blue-300 font-semibold">
                Interviewer
              </TableHead>
              <TableHead className="text-blue-300 font-semibold">
                Interviewee
              </TableHead>
              <TableHead className="text-blue-300 font-semibold">
                Question
              </TableHead>

              <TableHead
                className="cursor-pointer select-none text-blue-300 font-semibold"
                onClick={() => toggleSort("difficulty")}
              >
                <div className="flex items-center gap-1">
                  Difficulty
                  <ArrowUpDown
                    className={cn(
                      "h-4 w-4 transition-transform text-blue-400",
                      sortKey === "difficulty" && sortAsc && "rotate-180"
                    )}
                  />
                </div>
              </TableHead>

              <TableHead className="text-blue-300 font-semibold">
                Tags
              </TableHead>

              <TableHead
                className="text-right cursor-pointer select-none text-blue-300 font-semibold"
                onClick={() => toggleSort("date")}
              >
                <div className="flex items-center justify-end gap-1">
                  Date Attempted
                  <ArrowUpDown
                    className={cn(
                      "h-4 w-4 transition-transform text-blue-400",
                      sortKey === "date" &&
                        sortKey === "date" &&
                        !sortAsc &&
                        "rotate-180"
                    )}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow className="hover:bg-slate-900">
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-blue-300/70"
                >
                  No results found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer border-blue-800/30 hover:bg-slate-800/50 transition duration-150 ease-in-out"
                  onClick={() => {
                    setSelectedCode(item.current_code);
                    setSelectedTitle(
                      item.question?.title || "Untitled Question"
                    );
                    setOpen(true);
                  }}
                >
                  <TableCell className="text-blue-100">
                    {item.interviewer?.name || "Solo-Practice"}
                  </TableCell>
                  <TableCell className="text-blue-100">
                    {item.interviewee?.name || "Unknown"}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {item.question?.title || "Unknown"}
                  </TableCell>

                  <TableCell>
                    {item.question && (
                      <DifficultyBadge difficulty={item.question.difficulty} />
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[12rem]">
                      {item.question?.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-slate-700/70 text-blue-200 rounded-full px-2 py-0.5 break-words font-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-right text-blue-200 text-sm">
                    {new Date(item.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Code Dialog --- */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          // Reset AI state when dialog closes
          if (!isOpen) {
            setAiResponse("");
            setIsLoading(false);
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-blue-800/50 text-white shadow-xl sm:max-w-5xl lg:max-w-7xl">
          <DialogHeader className="border-b border-blue-800/30 pb-3">
            <DialogTitle className="text-xl font-bold text-blue-400">
              Code for: {selectedTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col md:flex-row gap-4">
            {/* --- Code Box --- */}
            <div className="flex-1 min-w-0">
              <div
                className="relative pretty-scrollbar bg-slate-800 rounded-lg
                 border border-blue-800/30 text-green-300 p-2 text-sm font-mono
                 max-h-[60vh] flex flex-col"
              >
                <button
                  className="absolute bottom-6 right-6
                   bg-gradient-to-r from-blue-500 to-indigo-600
                   hover:from-blue-600 hover:to-indigo-700
                   text-white p-2 rounded-md shadow-lg
                   transition-all duration-300 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsLoading(true);
                    setAiResponse("");
                    try {
                      if (!selectedCode) {
                        setAiResponse("Please select a code snippet first.");
                        return;
                      }

                      const data = await handleButtonClick(selectedCode);
                      setAiResponse(data.response);
                    } catch (error) {
                      console.error(error);
                      setAiResponse(
                        error instanceof Error
                          ? error.message
                          : "Failed to fetch response."
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  title="Generate AI Summary"
                >
                  <span className="font-bold text-sm">AI</span>
                </button>

                {/* scrollable and horizontally safe area */}
                <div className="overflow-auto flex-1">
                  {selectedCode ? (
                    <pre className="whitespace-pre-wrap break-all">
                      {selectedCode}
                    </pre>
                  ) : (
                    <p className="text-blue-300/70">
                      No code submitted for this session.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- AI Response Box --- */}
            <div className="flex-1 min-w-0">
              <div
                className="pretty-scrollbar bg-slate-800 rounded-lg p-4
                 overflow-y-auto max-h-[60vh] h-full text-sm font-mono
                 whitespace-pre-wrap border border-violet-400 text-slate-300"
              >
                {selectedCode ? (
                  isLoading ? (
                    <p className="text-slate-400">Generating...</p>
                  ) : aiResponse ? (
                    <div className="prose prose-sm prose-invert prose-slate max-w-none">
                      <ReactMarkdown>{aiResponse}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500">
                      Click the AI button to see the response here.
                    </p>
                  )
                ) : (
                  <p className="text-blue-300/70">
                    No code submitted for this session.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
