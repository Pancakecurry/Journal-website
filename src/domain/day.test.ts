import { describe, expect, it } from "vitest";
import { createDay, DaySchema } from "@/domain/day";
import { LocalDateSchema, localDateFor } from "@/domain/shared";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("Day", () => {
  it("preserves calendar identity independently from a UTC timestamp", () => {
    expect(localDateFor(new Date("2026-08-12T20:30:00.000Z"), "Asia/Kolkata")).toBe("2026-08-13");
    expect(localDateFor(new Date("2026-08-12T20:30:00.000Z"), "America/Los_Angeles")).toBe(
      "2026-08-12",
    );
  });

  it("creates a valid pending Day with stable ownership and timezone", () => {
    const day = createDay({ userId: USER_ID, localDate: "2026-08-12", timeZone: "Asia/Kolkata" });
    expect(DaySchema.parse(day)).toEqual(day);
    expect(day.syncState).toBe("pending");
    expect(day.localDate).toBe("2026-08-12");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => LocalDateSchema.parse("2026-02-31")).toThrow();
  });
});
