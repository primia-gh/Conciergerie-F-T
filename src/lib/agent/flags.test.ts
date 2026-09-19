import { afterEach, describe, expect, it, vi } from "vitest";
import { chatProspectionActif } from "./flags";

describe("chatProspectionActif", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("est désactivé quand la variable est absente", () => {
    vi.stubEnv("CHAT_PROSPECTION_ACTIF", "");
    expect(chatProspectionActif()).toBe(false);
  });

  it("n'accepte que la valeur exacte « true »", () => {
    vi.stubEnv("CHAT_PROSPECTION_ACTIF", "1");
    expect(chatProspectionActif()).toBe(false);
    vi.stubEnv("CHAT_PROSPECTION_ACTIF", "TRUE");
    expect(chatProspectionActif()).toBe(false);
    vi.stubEnv("CHAT_PROSPECTION_ACTIF", "true");
    expect(chatProspectionActif()).toBe(true);
  });
});
