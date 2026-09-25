import { describe, expect, it } from "vitest";
import { dateLongue, euros, ilYa } from "./dates";

// Espaces insécables : Intl les utilise en français (milliers et devise).
const net = (s: string) => s.replace(/[  ]/g, " ");

describe("ilYa", () => {
  const maintenant = Date.parse("2026-09-25T12:00:00Z");
  it("parle en minutes, heures puis jours", () => {
    expect(ilYa("2026-09-25T11:59:40Z", maintenant)).toBe("à l'instant");
    expect(ilYa("2026-09-25T11:55:00Z", maintenant)).toBe("il y a 5 min");
    expect(ilYa("2026-09-25T09:00:00Z", maintenant)).toBe("il y a 3 h");
    expect(ilYa("2026-09-24T10:00:00Z", maintenant)).toBe("hier");
    expect(ilYa("2026-09-21T12:00:00Z", maintenant)).toBe("il y a 4 jours");
  });
});

describe("dateLongue", () => {
  it("donne le jour de Paris, pas celui du serveur en UTC", () => {
    // 23 h 30 UTC le 24 = 1 h 30 à Paris le 25 (heure d'été).
    expect(dateLongue("2026-09-24T23:30:00Z")).toBe("vendredi 25 septembre");
  });
});

describe("euros", () => {
  it("affiche les montants à la française", () => {
    expect(net(euros("1250"))).toBe("1 250 €");
    expect(net(euros("89.5"))).toBe("89,50 €");
    expect(euros("abc")).toBe("—");
  });
});
