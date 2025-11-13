"use client";

import React, { createContext, useContext } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeContextType {
  channel: RealtimeChannel | null;
  endSession: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  channel: null,
  endSession: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);
export default RealtimeContext;
