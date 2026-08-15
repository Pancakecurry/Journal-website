import { localDateFor, type LocalDate } from "@/domain/shared";

const DEVELOPMENT_USER_ID = "00000000-0000-4000-8000-000000000001";

// Kept as a live binding for the existing local repositories. In configured mode the
// identity provider replaces it with the user returned by Supabase Auth before any
// journal surface mounts. It is never accepted as a remote production identity.
export let LOCAL_FOUNDATION_USER_ID = DEVELOPMENT_USER_ID;

export function setActiveJournalUserId(userId: string | null, localMode = false) {
  LOCAL_FOUNDATION_USER_ID = localMode ? DEVELOPMENT_USER_ID : (userId ?? DEVELOPMENT_USER_ID);
}

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
