import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("autorise les appels jusqu'à la limite puis bloque", () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("isole les compteurs par clé", () => {
    const keyA = `test-a-${crypto.randomUUID()}`;
    const keyB = `test-b-${crypto.randomUUID()}`;

    expect(checkRateLimit(keyA, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });

  it("réinitialise le compteur après expiration de la fenêtre", async () => {
    const key = `test-window-${crypto.randomUUID()}`;

    expect(checkRateLimit(key, 1, 20)).toBe(true);
    expect(checkRateLimit(key, 1, 20)).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(checkRateLimit(key, 1, 20)).toBe(true);
  });
});
