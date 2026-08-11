import { z } from "zod";

export const EntityIdSchema = z.uuid();
export type EntityId = z.infer<typeof EntityIdSchema>;

export const IsoTimestampSchema = z.iso.datetime({ offset: true });
export const LocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a calendar date in YYYY-MM-DD form")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }, "Expected a real calendar date");
export type LocalDate = z.infer<typeof LocalDateSchema>;

export const SyncStateSchema = z.enum(["local", "pending", "synced", "failed", "conflict"]);
export type SyncState = z.infer<typeof SyncStateSchema>;

export const nowIso = () => new Date().toISOString();
export const newEntityId = (): EntityId => crypto.randomUUID();

export function localDateFor(date: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return LocalDateSchema.parse(`${part("year")}-${part("month")}-${part("day")}`);
}
