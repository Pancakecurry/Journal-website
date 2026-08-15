import { expect, test } from "@playwright/test";

test("application responses carry the reviewed security headers", async ({ request }) => {
  const response = await request.get("/today");
  expect(response.ok()).toBe(true);
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
});

test("AI consent rejects a cross-site request before provider processing", async ({ request }) => {
  const response = await request.post("/api/ai/consent", {
    headers: { origin: "https://not-your-journal.example" },
    data: { confirmed: true, scopes: ["journal"] },
  });
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toEqual({
    error: "Cross-site AI requests are not allowed.",
  });
});

test("AI routes reject oversized bodies before touching private processing", async ({
  request,
}) => {
  const response = await request.post("/api/ai/embed", {
    data: { items: [{ kind: "journal", text: "x".repeat(121_000) }] },
  });
  expect(response.status()).toBe(413);
});

test("account deletion rejects a cross-site request before authentication", async ({ request }) => {
  const response = await request.delete("/api/account", {
    headers: { origin: "https://not-your-journal.example" },
  });
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toEqual({
    error: "Request origin was not accepted.",
  });
});
