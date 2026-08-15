import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("release PWA contract", () => {
  it("ships an installable standalone manifest with regular and maskable icons", () => {
    const value = manifest();
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/today");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });

  it("versions the app shell and refuses to cache auth or API requests", async () => {
    const worker = await readFile("public/sw.js", "utf8");
    expect(worker).toContain('const VERSION = "1.0.0"');
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('url.pathname.startsWith("/auth")');
    expect(worker).toContain("SKIP_WAITING");
  });
});
