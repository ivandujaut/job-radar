export interface Job {
  id: string;
  source: "linkedin-guest" | "linkedin-session" | "manual";
  url: string;
  title: string;
  company: string;
  location: string;
  postedAt?: string;
  description?: string;
  discoveredAt: string;
}

export interface Ranking {
  score: number; // 0-100
  reasons: string[];
  warnings: string[]; // e.g. "exige ingles fluido", "seniority dudoso"
}

export type QueueItemKind = "application" | "connection";

export type QueueStatus = "pending_rank" | "pending_review" | "approved" | "rejected" | "sent" | "discarded";

export interface QueueItem {
  id: string;
  kind: QueueItemKind;
  status: QueueStatus;
  job?: Job;
  ranking?: Ranking;
  /** Draft note or application answer awaiting human review/edit. */
  draft?: string;
  /** Person for connection requests. */
  person?: { name: string; role: string; company: string; url: string };
  history: { at: string; event: string }[];
}
