import { describe, expect, it } from "vitest";
import { DAY_MS, jstDayStart } from "./almanac";
import { HOME_DAYS_PRO, bestWindow, compareRows, dayChips, homeHref, isDayLocked, parseDayOffset, previewDays, rankSpots, sharedDomain } from "./home";
import { SPOTS } from "./spots";

const today = jstDayStart(2026, 11, 5);

describe("parseDayOffset", () => {
  it("無い・空・数字でない値は今日", () => {
    for (const raw of [undefined, "", "a", "-1", "1.5", " 1", "01", "１"]) expect(parseDayOffset(raw, true)).toBe(0);
  });
  it("無料は今日と明日だけ。それより先は今日に戻す", () => {
    expect(parseDayOffset("0", false)).toBe(0);
    expect(parseDayOffset("1", false)).toBe(1);
    expect(parseDayOffset("2", false)).toBe(0);
    expect(parseDayOffset("5", false)).toBe(0);
  });
  it("有料は5日先まで。範囲の外は今日", () => {
    expect(parseDayOffset("2", true)).toBe(2);
    expect(parseDayOffset("5", true)).toBe(5);
    expect(parseDayOffset("6", true)).toBe(0);
    expect(parseDayOffset("9", true)).toBe(0);
  });
});

describe("isDayLocked", () => {
  it("無料は2日先から鍵つき、有料は鍵なし", () => {
    expect([0, 1, 2, 5].map((d) => isDayLocked(d, false))).toEqual([false, false, true, true]);
    expect([0, 1, 2, 5].map((d) => isDayLocked(d, true))).toEqual([false, false, false, false]);
  });
});

describe("homeHref", () => {
  it("既定の値は入れない", () => {
    expect(homeHref({})).toBe("/");
    expect(homeHref({ spot: "oura", d: 0, q: "" })).toBe("/?spot=oura");
  });
  it("地点・日付・検索語を保つ", () => {
    expect(homeHref({ spot: "oura", d: 1, q: "佐賀" })).toBe(`/?spot=oura&d=1&q=${encodeURIComponent("佐賀")}`);
  });
});

describe("dayChips", () => {
  it("今日・明日・日にちの6つ。無料は2日先から /pricing", () => {
    const chips = dayChips(today, false, { spot: "jogashima" });
    expect(chips.map((c) => c.label)).toEqual(["今日", "明日", "7日", "8日", "9日", "10日"]);
    expect(chips.map((c) => c.locked)).toEqual([false, false, true, true, true, true]);
    expect(chips[0].href).toBe("/?spot=jogashima");
    expect(chips[1].href).toBe("/?spot=jogashima&d=1");
    expect(chips[2].href).toBe("/pricing");
  });
  it("有料はすべて選べる", () => {
    const chips = dayChips(today, true, { spot: "jogashima", q: "島" });
    expect(chips.every((c) => !c.locked)).toBe(true);
    expect(chips[5].href).toBe(`/?spot=jogashima&d=5&q=${encodeURIComponent("島")}`);
  });
});

describe("previewDays", () => {
  it("明日〜5日先の5枚。無料は明日だけ鍵なし", () => {
    const free = previewDays(today, false);
    expect(free).toHaveLength(HOME_DAYS_PRO);
    expect(free.map((p) => p.offset)).toEqual([1, 2, 3, 4, 5]);
    expect(free[0].dayStart).toBe(today + DAY_MS);
    expect(free.map((p) => p.locked)).toEqual([false, true, true, true, true]);
    expect(previewDays(today, true).every((p) => !p.locked)).toBe(true);
  });
});

describe("比較の表", () => {
  it("bestWindow は強い物、同じ強さなら早い方。無ければ null", () => {
    const w = (start: number, score: number) => ({ start, end: start + 1, peak: start, score, reason: "" });
    expect(bestWindow([])).toBeNull();
    expect(bestWindow([w(1, 50), w(2, 80), w(3, 80)])?.start).toBe(2);
  });
  it("rankSpots は強い順", () => {
    const rows = rankSpots(SPOTS, today);
    const scores = rows.map((r) => r.best?.score ?? -1);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(rows).toHaveLength(SPOTS.length);
  });
  it("無料は1位の1行だけ返し、残りは数だけ", () => {
    const free = compareRows(SPOTS, today, false);
    const pro = compareRows(SPOTS, today, true);
    expect(free.rows).toHaveLength(1);
    expect(free.locked).toBe(SPOTS.length - 1);
    expect(free.rows[0].d.spot.id).toBe(pro.rows[0].d.spot.id);
    expect(pro.rows).toHaveLength(SPOTS.length);
    expect(pro.locked).toBe(0);
  });
  it("sharedDomain は全部の幅を含む", () => {
    const days = rankSpots(SPOTS.slice(0, 2), today).map((r) => r.d);
    const dom = sharedDomain(days)!;
    for (const d of days) {
      expect(dom.lo).toBeLessThanOrEqual(d.range.lo);
      expect(dom.hi).toBeGreaterThanOrEqual(d.range.hi);
    }
    expect(sharedDomain([])).toBeUndefined();
  });
});
