import { describe, expect, it } from "vitest";
import { DIFFICULTY_IDS, FRAMEWORK_IDS, PERSONAS } from "@/lib/catalog";
import { dictionaries, LOCALES } from "@/lib/i18n/dictionaries";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("i18n dictionaries", () => {
  it("pt has exactly the same keys as en", () => {
    expect(keys(dictionaries.pt).sort()).toEqual(keys(dictionaries.en).sort());
  });

  it.each(LOCALES)("%s translates every persona, difficulty and framework", (locale) => {
    const t = dictionaries[locale];
    for (const p of PERSONAS) expect(t.personas[p.id]?.title).toBeTruthy();
    for (const d of DIFFICULTY_IDS) expect(t.difficulties[d].label).toBeTruthy();
    for (const f of FRAMEWORK_IDS) expect(t.frameworks[f].label).toBeTruthy();
  });

  it("has no empty strings", () => {
    const values = (obj: object): unknown[] =>
      Object.values(obj).flatMap((v) => (v && typeof v === "object" ? values(v) : [v]));
    for (const locale of LOCALES) {
      for (const v of values(dictionaries[locale])) expect(String(v).trim()).not.toBe("");
    }
  });
});
