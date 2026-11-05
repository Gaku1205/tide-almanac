import { describe, expect, it } from "vitest";
import {
  HOUR,
  MINUTE,
  dayAlmanac,
  extremes,
  hm,
  jiaiWindows,
  jpDay,
  jstDayStart,
  lightFactor,
  moonAge,
  photoMoments,
  startOfJstDay,
  sunTimes,
  tideLevel,
  tideName,
  tideStage,
} from "./almanac";
import { SPOTS, spotById } from "./spots";

const day = jstDayStart(2026, 11, 5);
const jogashima = spotById("jogashima");

describe("日付", () => {
  it("JST の 0時と、時刻の書き方", () => {
    expect(new Date(day).toISOString()).toBe("2026-11-04T15:00:00.000Z");
    expect(hm(day + 5 * HOUR + 7 * MINUTE)).toBe("5:07");
    expect(jpDay(day)).toBe("11月5日（木）");
    expect(startOfJstDay(day + 23 * HOUR)).toBe(day);
  });
});

describe("日の出・日の入り", () => {
  it("11月の三浦では、日の出は6時前後、日の入りは16時半前後", () => {
    const s = sunTimes(jogashima.lat, jogashima.lon, day);
    const rise = (s.rise - day) / HOUR;
    const set = (s.set - day) / HOUR;
    expect(rise).toBeGreaterThan(5.8);
    expect(rise).toBeLessThan(6.3);
    expect(set).toBeGreaterThan(16.4);
    expect(set).toBeLessThan(16.9);
    expect(s.dawn).toBeLessThan(s.rise);
    expect(s.dusk).toBeGreaterThan(s.set);
  });
});

describe("月齢と潮名", () => {
  it("新月のころは大潮、上弦のころは小潮", () => {
    expect(moonAge(Date.UTC(2000, 0, 6, 18, 14))).toBeCloseTo(0, 5);
    expect(tideName(0.4)).toBe("大潮");
    expect(tideName(14.6)).toBe("大潮");
    expect(tideName(7.2)).toBe("小潮");
    expect(tideName(9.5)).toBe("長潮");
    expect(tideName(10.5)).toBe("若潮");
    expect(tideName(4.5)).toBe("中潮");
  });
});

describe("潮位", () => {
  it("1日に満潮と干潮がおおよそ2回ずつある（太平洋側）", () => {
    const ex = extremes(jogashima, day, day + 24 * HOUR);
    expect(ex.filter((e) => e.kind === "high").length).toBeGreaterThanOrEqual(1);
    expect(ex.filter((e) => e.kind === "low").length).toBeGreaterThanOrEqual(1);
    expect(ex.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < ex.length; i++) expect(ex[i].kind).not.toBe(ex[i - 1].kind);
  });
  it("有明海は、油壺（城ヶ島）より潮の幅がずっと大きい（3倍以上）", () => {
    const span = (id: string) => {
      const a = dayAlmanac(spotById(id), day);
      return a.range.hi - a.range.lo;
    };
    expect(span("oura")).toBeGreaterThan(span("jogashima") * 3);
  });
  // 気象庁 潮位表 油壺（Z1）2026年、日本時間の大潮の日の公表値。許容は ±40 分（小潮の日は4分潮だけでは1時間以上ずれるので、大潮の日だけ）
  it("油壺の満潮・干潮の時刻が、気象庁の公表と ±40 分以内で合う（大潮の日）", () => {
    const published: [number, number, string[], string[]][] = [
      [10, 27, ["5:29", "16:34"], ["11:01", "23:23"]],
      [11, 8, ["4:18", "15:25"], ["9:48", "22:11"]],
      [11, 10, ["5:37", "16:15"], ["10:54", "23:12"]],
      [11, 24, ["4:48", "15:26"], ["10:05", "22:30"]],
    ];
    const min = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    for (const [m, d, highs, lows] of published) {
      const start = jstDayStart(2026, m, d);
      const ex = extremes(jogashima, start - 3 * HOUR, start + 27 * HOUR);
      for (const [kind, times] of [["high", highs], ["low", lows]] as const) {
        for (const t of times) {
          const target = start + min(t) * MINUTE;
          const near = ex.filter((e) => e.kind === kind).reduce((a, b) => (Math.abs(b.t - target) < Math.abs(a.t - target) ? b : a));
          expect(Math.abs(near.t - target) / MINUTE, `${m}/${d} ${kind} ${t}`).toBeLessThanOrEqual(40);
        }
      }
    }
  });
  it("満潮の直後は下げ、干潮の直後は上げ", () => {
    const ex = extremes(jogashima, day, day + 24 * HOUR);
    const high = ex.find((e) => e.kind === "high")!;
    const s = tideStage(jogashima, high.t + 2 * HOUR);
    expect(s.rising).toBe(false);
    expect(s.label.startsWith("下げ")).toBe(true);
    expect(tideLevel(jogashima, high.t)).toBeGreaterThan(tideLevel(jogashima, high.t + 2 * HOUR));
  });
});

describe("時合い", () => {
  it("どの地点でも1つ以上の窓があり、強さは0〜100で時刻の順", () => {
    for (const spot of SPOTS) {
      const ws = jiaiWindows(spot, day);
      expect(ws.length).toBeGreaterThan(0);
      expect(ws.length).toBeLessThanOrEqual(3);
      for (const w of ws) {
        expect(w.score).toBeGreaterThanOrEqual(0);
        expect(w.score).toBeLessThanOrEqual(100);
        expect(w.end).toBeGreaterThan(w.start);
        expect(w.peak).toBeGreaterThanOrEqual(w.start);
      }
      for (let i = 1; i < ws.length; i++) expect(ws[i].start).toBeGreaterThan(ws[i - 1].start);
    }
  });
  it("光の重なりは、日の出ちょうどで1、2時間離れると0", () => {
    const s = sunTimes(jogashima.lat, jogashima.lon, day);
    expect(lightFactor(s.rise, s)).toBe(1);
    expect(lightFactor(s.rise + 2 * HOUR, s)).toBe(0);
  });
});

describe("撮影", () => {
  it("朝と夕の青い時間があり、潮の高さは0〜100", () => {
    const ps = photoMoments(jogashima, day);
    expect(ps.map((p) => p.kind)).toEqual(["朝の青", "夕の青"]);
    for (const p of ps) {
      expect(p.tidePercent).toBeGreaterThanOrEqual(0);
      expect(p.tidePercent).toBeLessThanOrEqual(100);
      expect(p.mirror).toBe(p.tidePercent <= 30);
    }
  });
});
