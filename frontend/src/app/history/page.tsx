/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-11-09
Scope: Reviewed the code, found potential small bugs, and suggested small fixes to avoid runtime issues.
Author review: I verified correctness of the modifications by AI against requirements.
*/
"use client";

import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import Header from "../_components/Header";
import HistoryTable from "./components/HistoryTable";
import { HistoryData } from "./types/HistoryData";
import axiosInstance from "@/lib/axios";
import { Loader2 } from "lucide-react";

export default function HistoryPage() {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await axiosInstance.post(
          "/api/collaboration-service/sessions/getUserSessions"
        );
        if (res.status !== 200) throw new Error("Failed to fetch records");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
    // fetchMockData(setData, setLoading);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header/>
      <CardContent className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p>Loading your interview history...</p>
          </div>
        ) : (
          <HistoryTable data={data} />
        )}
      </CardContent>
    </div>
  );
}
