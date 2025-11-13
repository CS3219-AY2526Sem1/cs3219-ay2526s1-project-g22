"use client";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from "lucide-react";
import RecentSessionsTable from "./_components/RecentSessionsTable";
import { useRouter } from "next/navigation";
import { useGetHistoryData } from "@/queries/use-get-history-data";

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { data, isLoading: sessionsLoading } = useGetHistoryData();

  if (isLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (sessionsLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-white text-lg">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header />

      <main className="mx-auto px-6 py-8 container my-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user?.name || "Developer"}! 👋
              </h1>
              <p className="text-slate-300 text-lg">
                Ready to sharpen your coding skills with a new challenge?
              </p>
            </div>

            {/* Find Match Button */}
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => router.push("/matching")}
            >
              <Users className="w-5 h-5 mr-3" />
              Find Match
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Previous Matches Table */}
        <RecentSessionsTable matches={data?.splice(0, 3) ?? []} />
      </main>

      <Footer />
    </div>
  );
}
