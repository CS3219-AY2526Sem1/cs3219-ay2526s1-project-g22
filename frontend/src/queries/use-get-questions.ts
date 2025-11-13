import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const microServiceEntryPoint = `/api/question-service`;
const baseUrl = `${microServiceEntryPoint}/questions`;

export interface Question {
  _id?: string;
  questionId: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  content: string;
  tags: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codeSnippets?: any[];
}

export function useGetQuestions(
  difficulty?: "Easy" | "Medium" | "Hard",
  topics?: string[]
) {
  return useQuery({
    queryKey: ["questions", { difficulty, topics }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (topics && topics.length > 0)
        params.append("topics", topics.join(","));
      const url = `${baseUrl}?${params.toString()}`;
      const response = await axiosInstance.get<Question[]>(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
}

export function useGetRandomQuestion(
  difficulty?: "Easy" | "Medium" | "Hard",
  topics?: string[]
) {
  return useQuery({
    queryKey: ["randomQuestion", { difficulty, topics }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (difficulty) params.append("difficulty", difficulty);
      if (topics && topics.length > 0)
        params.append("topics", topics.join(","));
      const url = `${baseUrl}/random?${params.toString()}`;
      const response = await axiosInstance.get<Question>(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
}
