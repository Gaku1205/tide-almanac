import { describe, expect, it } from "vitest";
import { extremes, HOUR, jiaiWindows, jstDayStart, MINUTE } from "./almanac";
import { SPOTS } from "./spots";
import { DEFAULT_SETTINGS, parseThreshold, planNotifications, type NotificationSettings } from "./notifications";

const spot = SPOTS[0];
const date = jstDayStart(2026, 11, 6); // 知らせる日（明日）
const now = jstDayStart(2026, 11, 5) + 9 * HOUR; // 前日 9:00 JST
const on: NotificationSettings = { jiai: true, lowTide: true, thresholdCm: 30 };

describe("parseThreshold", () => {
  it("0〜200 の整数を通す", () => {
    expect(parseThreshold("0")).toBe(0);
    expect(parseThreshold(" 30 ")).toBe(30);
    expect(parseThreshold("200")).toBe(200);
  });
  it("範囲外・数値でない・空は通さない", () => {
    for (const v of ["201", "-1", "abc", "", "  ", "3.5", "1e2", "0x10", null, undefined]) expect(parseThreshold(v)).toBeNull();
  });
});

describe("planNotifications：時合い", () => {
  const list = planNotifications(spot, date, { ...on, lowTide: false }, now);
  const windows = jiaiWindows(spot, date);

  it("前の晩21時（JST）に1通、時合いごとに開始の90分前", () => {
    expect(windows.length).toBeGreaterThan(0);
    const evening = list.filter((n) => n.kind === "jiai-evening");
    expect(evening).toHaveLength(1);
    expect(evening[0].sendAt).toBe(jstDayStart(2026, 11, 5) + 21 * HOUR);
    const best = windows.reduce((a, w) => (w.score > a.score ? w : a));
    expect(evening[0].sendAt).toBeLessThan(date); // 前の日の晩（日付をまたぐ）
    expect(evening[0].window).toEqual(best);
    const before = list.filter((n) => n.kind === "jiai-before").map((n) => n.sendAt);
    expect(before).toEqual(windows.map((w) => w.start - 90 * MINUTE).filter((t) => t >= now));
  });
  it("送る時刻の早い順", () => {
    const t = list.map((n) => n.sendAt);
    expect(t).toEqual([...t].sort((a, b) => a - b));
  });
  it("時合いの通知が off なら返さない", () => {
    expect(planNotifications(spot, date, { ...on, jiai: false, lowTide: false }, now)).toEqual([]);
  });
  it("90分前が前の日に入ることがある（日付をまたぐ）", () => {
    // 1か月のうち、開始が 1:30 より前の時合いがあれば、90分前は前日の日付になる
    let found = false;
    for (let d = 1; d <= 30 && !found; d++) {
      const day = jstDayStart(2026, 11, d);
      for (const w of jiaiWindows(spot, day)) {
        if (w.start - day >= 90 * MINUTE) continue;
        const n = planNotifications(spot, day, { ...on, lowTide: false }, 0).find((x) => x.kind === "jiai-before" && x.window?.start === w.start);
        expect(n?.sendAt).toBe(w.start - 90 * MINUTE);
        expect(n!.sendAt).toBeLessThan(day);
        found = true;
      }
    }
  });
  it("現在時刻より前の送信時刻は返さない", () => {
    const late = jstDayStart(2026, 11, 5) + 22 * HOUR;
    expect(planNotifications(spot, date, { ...on, lowTide: false }, late).every((n) => n.kind !== "jiai-evening")).toBe(true);
    expect(planNotifications(spot, date, { ...on, lowTide: false }, date + 24 * HOUR)).toEqual([]);
  });
});

describe("planNotifications：干潮", () => {
  // 翌朝（0時〜正午）でいちばん低い干潮を探して、しきい値の上下を試す
  const lows = extremes(spot, date, date + 12 * HOUR).filter((e) => e.kind === "low");
  it("見本の地点に翌朝の干潮がある", () => expect(lows.length).toBeGreaterThan(0));
  const lowest = lows.reduce((a, e) => (e.h < a.h ? e : a), lows[0]);
  const only = (thresholdCm: number) => planNotifications(spot, date, { jiai: false, lowTide: true, thresholdCm }, now);

  it("しきい値を下回れば、前の晩21時に送る対象として返す", () => {
    const r = only(Math.ceil(lowest.h) + 1);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((n) => n.kind === "low-tide" && n.sendAt === jstDayStart(2026, 11, 5) + 21 * HOUR)).toBe(true);
    expect(r.map((n) => n.low?.t)).toContain(lowest.t);
  });
  it("しきい値以上なら返さない（同じ値は下回らない）", () => {
    expect(only(Math.floor(lowest.h) - 1)).toEqual([]);
    expect(only(lowest.h)).toEqual([]);
  });
  it("干潮の通知が off なら返さない", () => {
    expect(planNotifications(spot, date, { jiai: false, lowTide: false, thresholdCm: 200 }, now)).toEqual([]);
  });
  it("初期の設定は両方 off", () => {
    expect(planNotifications(spot, date, DEFAULT_SETTINGS, now)).toEqual([]);
  });
});
