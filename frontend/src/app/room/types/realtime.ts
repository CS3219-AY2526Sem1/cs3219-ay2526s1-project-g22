import { Question } from "@/queries/use-get-questions";

export type SyncRequestPayload = {
  type: "sync_request";
  from: string;
  ts: number;
};

export type SyncResponsePayload = {
  type: "sync_response";
  to: string;
  from: string;
  code: string;
  ts: number;
};

export type SyncAckPayload = {
  type: "sync_ack";
  to: string;
  from: string;
  ts: number;
};

export type CodeUpdatePayload = {
  type: "code_update";
  from: string;
  code: string;
  ts: number;
};

export type AnyPayload =
  | SyncRequestPayload
  | SyncResponsePayload
  | SyncAckPayload
  | CodeUpdatePayload;
