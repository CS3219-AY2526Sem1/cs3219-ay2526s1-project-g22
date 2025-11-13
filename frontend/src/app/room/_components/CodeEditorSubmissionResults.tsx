/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Assisted implementing some parts of HTML.
Author review: I verified correctness of the modifications by AI against requirements adn tested it
*/
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

function CodeEditorSubmissionResults({
  submissionHistory,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionHistory: any[];
}) {
  return (
    <>
      {submissionHistory.length > 0 && (
        <div className="min-h-0 overflow-auto">
          <Card className="flex-1 bg-slate-900/50 border-slate-600/50 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-600/30">
              <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Execution Results
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-row gap-4">
                {submissionHistory
                  .slice(-5)
                  .reverse()
                  .map((submission, index) => (
                    <div
                      key={submissionHistory.length - 1 - index}
                      className="bg-slate-800/60 border border-slate-600/40 rounded-lg p-4 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3 gap-4">
                        <h4 className="font-semibold text-slate-200 text-sm">
                          {submission.language}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          #{submissionHistory.length - index}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 rounded-md p-3 border border-slate-700/50 flex items-center gap-4 text-white">
                        {submission.output}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default CodeEditorSubmissionResults;
