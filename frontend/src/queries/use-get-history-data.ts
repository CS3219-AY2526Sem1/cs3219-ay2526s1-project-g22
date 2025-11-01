import { HistoryData } from "@/app/history/types/HistoryData";
import axiosInstance from "@/lib/axios";
import { queryClient } from "@/providers/query-client-provider";
import { useQuery } from "@tanstack/react-query";

const microServiceEntryPoint = `/api/collaboration-service`;
const baseUrl = `${microServiceEntryPoint}/sessions/getUserSessions`;

export function useGetHistoryData() {
  return useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await axiosInstance.post<HistoryData[]>(baseUrl);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
}

export function invalidateHistoryData() {
  queryClient.invalidateQueries({ queryKey: ["history"] });
}
