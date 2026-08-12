import type { LocalDate, SyncState } from "@/domain/shared";

export type ContentKind = "moment" | "journal" | "photo" | "reflection" | "tracker";

export interface DaySummary {
  id: string;
  userId: string;
  localDate: LocalDate;
  mood: "bright" | "good" | "okay" | "off" | "rough" | null;
  momentCount: number;
  journalCount: number;
  photoCount: number;
  reflectionCount: number;
  trackerCount: number;
  preview: string;
  updatedAt: string;
}

export interface JournalSummary {
  id: string;
  userId: string;
  dayId: string;
  localDate: LocalDate;
  title: string | null;
  preview: string;
  wordCount: number;
  bookmarked: boolean;
  updatedAt: string;
}

export interface SearchDocument {
  id: string;
  userId: string;
  entityId: string;
  dayId: string;
  localDate: LocalDate;
  kind: ContentKind;
  title: string;
  preview: string;
  normalizedText: string;
  updatedAt: string;
}

export interface SearchTerm {
  id: string;
  userId: string;
  token: string;
  documentId: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  journalEntryId: string;
  createdAt: string;
  version: number;
  syncState: SyncState;
  deletedAt: string | null;
}

export const TRACKER_TYPES = [
  "yes_no",
  "count",
  "number",
  "scale",
  "duration",
  "short_text",
  "single_select",
] as const;
export type TrackerType = (typeof TRACKER_TYPES)[number];
export type TrackerValue = boolean | number | string;

export interface TrackerDefinition {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: TrackerType;
  options: string[];
  unit: string;
  pinned: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncState: SyncState;
  deletedAt: string | null;
}

export interface TrackerEntry {
  id: string;
  userId: string;
  trackerId: string;
  dayId: string;
  localDate: LocalDate;
  value: TrackerValue;
  note: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncState: SyncState;
  deletedAt: string | null;
}

export interface MonthlyReflection {
  id: string;
  userId: string;
  month: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncState: SyncState;
  deletedAt: string | null;
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function searchTokens(value: string): string[] {
  return [
    ...new Set(
      normalizeSearchText(value)
        .match(/[\p{L}\p{N}]+/gu)
        ?.filter((token) => token.length > 1)
        .slice(0, 160) ?? [],
    ),
  ];
}

export function journalPreview(body: string, limit = 240): string {
  const plain = body.replace(/\s+/g, " ").trim();
  return plain.length > limit ? `${plain.slice(0, limit).trimEnd()}…` : plain;
}
