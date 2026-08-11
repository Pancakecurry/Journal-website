import type { Day } from "@/domain/day";
import { createDay } from "@/domain/day";
import type { Moment } from "@/domain/moment";
import { createTextMoment } from "@/domain/moment";
import { newEntityId, nowIso, type LocalDate } from "@/domain/shared";
import type { OutboxOperation } from "@/domain/sync";
import { OutboxOperationSchema } from "@/domain/sync";
import type { JournalDatabase } from "@/infrastructure/local/database";

export interface DayWithMoments {
  day: Day | null;
  moments: Moment[];
}

export class LocalJournalRepository {
  constructor(private readonly database: JournalDatabase) {}

  async getDay(userId: string, localDate: LocalDate): Promise<DayWithMoments> {
    const day = await this.database.days
      .where("[userId+localDate]")
      .equals([userId, localDate])
      .first();
    if (!day) return { day: null, moments: [] };
    const moments = await this.database.moments
      .where("[userId+dayId]")
      .equals([userId, day.id])
      .filter((moment) => moment.deletedAt === null)
      .sortBy("occurredAt");
    return { day, moments };
  }

  async addTextMoment(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    text: string;
  }): Promise<{ day: Day; moment: Moment }> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.outbox],
      async () => {
        let day = await this.database.days
          .where("[userId+localDate]")
          .equals([input.userId, input.localDate])
          .first();

        if (!day) {
          day = createDay(input);
          await this.database.days.add(day);
          await this.database.outbox.add(this.operationFor("day", day.id, day));
        }

        const moment = createTextMoment({ userId: input.userId, dayId: day.id, text: input.text });
        await this.database.moments.add(moment);
        await this.database.outbox.add(this.operationFor("moment", moment.id, moment));
        return { day, moment };
      },
    );
  }

  private operationFor(
    entityType: OutboxOperation["entityType"],
    entityId: string,
    payload: unknown,
  ): OutboxOperation {
    const timestamp = nowIso();
    return OutboxOperationSchema.parse({
      operationId: newEntityId(),
      userId: (payload as { userId: string }).userId,
      entityType,
      entityId,
      action: "upsert",
      expectedVersion: (payload as { version: number }).version,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      nextAttemptAt: timestamp,
      lastError: null,
    });
  }
}
