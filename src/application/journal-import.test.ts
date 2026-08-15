import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { JournalExportService } from "@/application/journal-export";
import { JournalImportService } from "@/application/journal-import";
import { JournalDatabase } from "@/infrastructure/local/database";
import { seedHistoryFixture } from "@/test/history-fixtures";

const SOURCE = "11111111-1111-4111-8111-111111111111";
const TARGET = "22222222-2222-4222-8222-222222222222";
const names: string[] = [];
afterEach(async () => Promise.all(names.splice(0).map((name) => Dexie.delete(name))));

describe("journal archive restoration", () => {
  it("inspects before writing and restores a complete archive for the active owner", async () => {
    const source = make();
    await seedHistoryFixture(source, SOURCE, "several");
    const blob = await new JournalExportService(source).completeArchive(SOURCE);
    const target = make();
    const service = new JournalImportService(target);
    const inspection = await service.inspect(
      new File([blob], "journal.zip", { type: "application/zip" }),
    );
    expect(await target.days.count()).toBe(0);
    const result = await service.restore(TARGET, inspection);
    expect(result.imported).toBeGreaterThan(8);
    expect(await target.days.where("userId").equals(TARGET).count()).toBe(8);
    expect(await target.outbox.filter((item) => item.userId === TARGET).count()).toBeGreaterThan(8);
    source.close();
    target.close();
  });

  it("preserves colliding records under new stable IDs instead of overwriting", async () => {
    const source = make();
    await seedHistoryFixture(source, SOURCE, "several");
    const archive = await new JournalExportService(source).completeArchive(SOURCE);
    const target = make();
    const service = new JournalImportService(target);
    const inspection = await service.inspect(new File([archive], "journal.zip"));
    await service.restore(TARGET, inspection);
    const second = await service.restore(TARGET, inspection);
    expect(second.preservedConflicts).toBeGreaterThan(0);
    expect(await target.days.where("userId").equals(TARGET).count()).toBe(16);
    source.close();
    target.close();
  });

  it("rejects unsupported JSON without touching the journal", async () => {
    const target = make();
    const service = new JournalImportService(target);
    await expect(service.inspect(new File(["{}"], "not-a-journal.json"))).rejects.toThrow(
      "supported Campus Atelier",
    );
    expect(await target.days.count()).toBe(0);
    target.close();
  });
});

function make() {
  const name = `import-${crypto.randomUUID()}`;
  names.push(name);
  return new JournalDatabase(name);
}
