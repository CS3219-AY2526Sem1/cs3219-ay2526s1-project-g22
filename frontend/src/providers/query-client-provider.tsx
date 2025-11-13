/*
AI Assistance Disclosure:
Tool: Deepseek R1, date: 2025-09-18
Scope: Reviewed the code and suggested small fixes or refactors; applied minor cleanups.
Author review: I verified correctness of the modifications by AI against requirements. I cleaned up small issues and ran basic checks to confirm behavior.
*/
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const ReactQueryProvider = ({ children }: IProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
