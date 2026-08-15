import Dexie from "dexie";
import { unzipSync, strFromU8 } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import { JournalExportService } from "@/application/journal-export";
import { JournalDatabase } from "@/infrastructure/local/database";
import { seedHistoryFixture } from "@/test/history-fixtures";

const USER = "11111111-1111-4111-8111-111111111111";
const names: string[] = [];
afterEach(async () => {
  await Promise.all(names.splice(0).map((name) => Dexie.delete(name)));
});

describe("journal ownership export", () => {
  it("creates versioned structured and readable copies without derived AI data", async () => {
    const database = make();
    await seedHistoryFixture(database, USER, "several");
    const service = new JournalExportService(database);
    const structured = await service.structured(USER);
    expect(structured.manifest.formatVersion).toBe("1.0.0");
    expect(structured.manifest.derivedAiDataIncluded).toBe(false);
    expect(structured.data.days).toHaveLength(8);
    expect(await service.markdown(USER)).toContain("# My Campus Atelier Journal");
    database.close();
  });

  it("packs a complete private archive with manifest, JSON, and Markdown", async () => {
    const database = make();
    await seedHistoryFixture(database, USER, "several");
    const archive = await new JournalExportService(database).completeArchive(USER);
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["manifest.json", "data/journal.json", "journal.md", "README.txt"]),
    );
    expect(JSON.parse(strFromU8(files["manifest.json"]!)).format).toBe(
      "campus-atelier-journal-export",
    );
    database.close();
  });
});
function make() {
  const name = `export-${crypto.randomUUID()}`;
  names.push(name);
  return new JournalDatabase(name);
}
