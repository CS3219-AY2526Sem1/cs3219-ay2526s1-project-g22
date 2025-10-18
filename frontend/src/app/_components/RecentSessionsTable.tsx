import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import React from "react";
import { Match } from "../page";

function RecentSessionsTable({ matches }: { matches: Match[] }) {
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
                  Partner
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
                        {match.interviewee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-white font-medium">
                        {match.interviewee}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-200">{match.question}</span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      className={`
                            ${
                              match.difficulty === "Easy"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : ""
                            }
                            ${
                              match.difficulty === "Medium"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : ""
                            }
                            ${
                              match.difficulty === "Hard"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : ""
                            }
                          `}
                    >
                      {match.difficulty}
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
