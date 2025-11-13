/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Reviewed the code structure and caught a few minor issues, then suggested small improvements.
Author review: I verified correctness of the modifications by AI against requirements — I debugged UI styling and confirmed the component renders correctly.
*/
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import React from "react";
import { HistoryData } from "../history/types/HistoryData";

function RecentSessionsTable({ matches }: { matches: HistoryData[] }) {
  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-600/50 shadow-xl">
      <CardHeader className="border-b border-slate-600/30">
        <CardTitle className="text-white text-xl flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" />
          Recent Coding Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600/30">
                <th className="text-left py-4 px-6 text-slate-300 font-medium">
                  Interviewer
                </th>
                <th className="text-left py-4 px-6 text-slate-300 font-medium">
                  Interviewee
                </th>
                <th className="text-left py-4 px-6 text-slate-300 font-medium">
                  Question
                </th>
                <th className="text-left py-4 px-6 text-slate-300 font-medium">
                  Difficulty
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  key={match.id}
                  className="border-b border-slate-600/20 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(match.interviewer?.name?.[0] ?? "").toUpperCase()}
                      </div>
                      <span className="text-white font-medium">
                        {match.interviewer?.name ?? "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(match.interviewee?.name?.[0] ?? "").toUpperCase()}
                      </div>
                      <span className="text-white font-medium">
                        {match.interviewee?.name ?? "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-200">
                      {match.question?.title ?? "N/A"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      className={
                        match.question?.difficulty === "Easy"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : match.question?.difficulty === "Medium"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : match.question?.difficulty === "Hard"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : ""
                      }
                    >
                      {match.question?.difficulty ?? "N/A"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentSessionsTable;
