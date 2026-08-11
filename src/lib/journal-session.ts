import { localDateFor, type LocalDate } from "@/domain/shared";

export const LOCAL_FOUNDATION_USER_ID = "00000000-0000-4000-8000-000000000001";

export function currentDayContext(date = new Date()): { localDate: LocalDate; timeZone: string } {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return { localDate: localDateFor(date, timeZone), timeZone };
}

export function readableDate(localDate: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(
    undefined,
    options ?? { weekday: "long", month: "long", day: "numeric" },
  ).format(new Date(`${localDate}T12:00:00`));
}
