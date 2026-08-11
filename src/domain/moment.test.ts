import { describe, expect, it } from "vitest";
import { createTextMoment, MomentSchema } from "@/domain/moment";

describe("Moment", () => {
  it("requires a Day association and non-empty validated content", () => {
    const moment = createTextMoment({
      userId: "11111111-1111-4111-8111-111111111111",
      dayId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      text: "Had ramen after class.",
    });
    expect(MomentSchema.parse(moment).dayId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(moment.content).toEqual({ kind: "text", text: "Had ramen after class." });
  });

  it("rejects empty text", () => {
    expect(() =>
      createTextMoment({
        userId: "11111111-1111-4111-8111-111111111111",
        dayId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        text: "   ",
      }),
    ).toThrow();
  });
});
