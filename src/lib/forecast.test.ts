import { describe, expect, it } from "vitest";
import { HOUR, jstDayStart } from "./almanac";
import { FORECAST_DAYS_PRO, calendarRows, forecastDayStarts, photoMornings, photoToday } from "./forecast";
import { SPOTS } from "./spots";

const spot = SPOTS[0];
const today = jstDayStart(2026, 11, 5);

describe("先読みの日数", () => {
  it("無料は今日と明日、有料は今日から30日先まで", () => {
    expect(forecastDayStarts(today, false)).toEqual([today, today + 24 * HOUR]);
    const pro = forecastDayStarts(today, true);
    expect(pro).toHaveLength(FORECAST_DAYS_PRO + 1);
    expect(pro[0]).toBe(today);
    expect(pro[pro.length - 1]).toBe(today + 30 * 24 * HOUR);
  });
});

describe("30日先までの暦", () => {
  it("日ごとに潮名といちばん強い時合いが付く", () => {
    const rows = calendarRows(spot, today, true);
    expect(rows).toHaveLength(31);
    for (const r of rows) {
      expect(["大潮", "中潮", "小潮", "長潮", "若潮"]).toContain(r.name);
      if (r.best) {
        expect(r.best.score).toBeGreaterThan(0);
        expect(r.best.score).toBeLessThanOrEqual(100);
      }
    }
  });
  it("無料の行は2日だけ", () => {
    expect(calendarRows(spot, today, false)).toHaveLength(2);
  });
});

describe("撮影の青い時間×潮の高さ", () => {
  it("朝の青で潮が低い朝だけが日付順に並ぶ", () => {
    const list = photoMornings(spot, today, true);
    for (const p of list) {
      expect(p.moment.kind).toBe("朝の青");
      expect(p.moment.mirror).toBe(true);
    }
    for (let i = 1; i < list.length; i++) expect(list[i].dayStart).toBeGreaterThan(list[i - 1].dayStart);
  });
  it("無料の探し方は明日より先に出ない", () => {
    const list = photoMornings(spot, today, false);
    expect(list.every((p) => p.dayStart <= today + 24 * HOUR)).toBe(true);
  });
  it("無料の撮影は今日の朝と夕だけ", () => {
    expect(photoToday(spot, today).map((m) => m.kind)).toEqual(["朝の青", "夕の青"]);
  });
});
