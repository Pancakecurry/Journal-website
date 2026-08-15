import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAiServerProvider } from "@/infrastructure/ai/openai-provider";

const configuration = {
  configured: true as const,
  provider: "openai" as const,
  apiKey: "not-a-real-key",
  consentSecret: "a".repeat(32),
  generationModel: "test-generation",
  embeddingModel: "test-embedding",
  embeddingDimensions: 4,
};
afterEach(() => vi.unstubAllGlobals());

describe("OpenAI adapter boundary", () => {
  it("uses bounded embedding configuration without exposing its key in the body", async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        model: "test-embedding",
        dimensions: 4,
        input: ["ordinary day"],
      });
      expect(String(init?.body)).not.toContain(configuration.apiKey);
      return Response.json({
        model: "test-embedding",
        data: [{ index: 0, embedding: [1, 0, 0, 1] }],
      });
    });
    vi.stubGlobal("fetch", fetch);
    expect(
      (await new OpenAiServerProvider(configuration).embed(["ordinary day"])).vectors,
    ).toHaveLength(1);
  });

  it("requests stateless structured answers and drops spoofed source IDs", async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body));
      expect(request.store).toBe(false);
      expect(request.text.format.type).toBe("json_schema");
      return Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  answer: "You wrote about ramen.",
                  sourceIds: ["allowed", "invented"],
                  uncertainty: null,
                }),
              },
            ],
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetch);
    const answer = await new OpenAiServerProvider(configuration).answer("What did I eat?", [
      { id: "allowed", title: "Moment", date: "2026-08-12", kind: "moment", text: "Had ramen." },
    ]);
    expect(answer.sourceIds).toEqual(["allowed"]);
  });
});
