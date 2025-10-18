import { Badge } from "@/components/ui/badge";
import React from "react";

function QuestionStats({
  stats,
  tag,
}: {
  stats: number;
  tag: "E" | "M" | "H";
}) {
  const colorClasses: Record<
    "E" | "M" | "H",
    { bg: string; text: string; hover: string }
  > = {
    E: {
      bg: "bg-green-100",
      text: "text-green-600",
      hover: "hover:bg-green-600",
    },
    M: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      hover: "hover:bg-yellow-600",
    },
    H: { bg: "bg-red-100", text: "text-red-600", hover: "hover:bg-red-600" },
  };

  return (
    <div className="text-center space-y-2">
      <div className="flex justify-center">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center ${colorClasses[tag].bg}`}
        >
          <Badge className={`bg-transparent text-lg px-3 py-1 text-black`}>
            {tag}
          </Badge>
        </div>
      </div>
      <div>
        <p className={`text-3xl font-bold ${colorClasses[tag].text}`}>
          {stats}
        </p>
        <p className="text-sm text-gray-200">
          {tag === "E" ? "Easy" : tag === "M" ? "Medium" : "Hard"}
        </p>
      </div>
    </div>
  );
}

export default QuestionStats;
