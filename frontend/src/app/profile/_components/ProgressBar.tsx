import React from "react";

function ProgressBar({
  questionsStats,
  tag,
}: {
  questionsStats: { easy: number; medium: number; hard: number; total: number };
  tag: "easy" | "medium" | "hard";
}) {
  const colorClasses: Record<
    "easy" | "medium" | "hard",
    { text: string; bg: string }
  > = {
    easy: { text: "text-green-600", bg: "bg-green-500" },
    medium: { text: "text-yellow-600", bg: "bg-yellow-500" },
    hard: { text: "text-red-600", bg: "bg-red-500" },
  };

  return (
    <div className="space-y-2">
      {/* Label and Stats */}
      <div className="flex justify-between text-sm">
        <span className={`${colorClasses[tag].text} font-medium`}>
          {tag === "easy" ? "Easy" : tag === "medium" ? "Medium" : "Hard"}
        </span>
        <span className="text-gray-200">
          {questionsStats[tag]}/{questionsStats.total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[tag].bg} h-2 rounded-full`}
          style={{
            width: `${(questionsStats[tag] / questionsStats.total) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

export default ProgressBar;
