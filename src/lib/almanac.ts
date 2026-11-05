// 潮汐暦の計算（入力から出力が決まる物だけ。テストは almanac.test.ts）
// 時刻はすべて UTC のミリ秒で持ち、画面に出すときだけ日本時間（JST）にする。
// 潮位は主な4つの分潮（M2・S2・K1・O1）の和で推算する。気象や地形による差は入らない（画面に「推算値」と書く）。

export const HOUR = 3_600_000;
export const MINUTE = 60_000;
const DAY = 24 * HOUR;
const JST = 9 * HOUR;
const RAD = Math.PI / 180;

export type Constituent = { amp: number; phase: number };
export type Harmonics = { M2: Constituent; S2: Constituent; K1: Constituent; O1: Constituent };

export type Spot = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  /** 調和定数を取った観測点の名前（出典の表の地点名） */
  station: string;
  /** 観測点の経度（東経・度）。気象庁の遅角 κ を G = κ − p·λ に直すのに使う */
  stationLon: number;
  /** 平均の潮位（cm。潮位表基準面から） */
  msl: number;
  harmonics: Harmonics;
};

// ---- 日付（JST） ----

/** JST の y年m月d日 0時（UTC のミリ秒） */
export function jstDayStart(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d) - JST;
}

/** ある時刻の、JST の日付 */
export function jstDate(ms: number): { y: number; m: number; d: number; w: number } {
  const t = new Date(ms + JST);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), w: t.getUTCDay() };
}

/** ある時刻を含む JST の日の 0時 */
export function startOfJstDay(ms: number): number {
  const { y, m, d } = jstDate(ms);
  return jstDayStart(y, m, d);
}

/** JST の「5:07」のような時刻 */
export function hm(ms: number): string {
  const t = new Date(ms + JST);
  return `${t.getUTCHours()}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
/** 「11月5日（水）」 */
export function jpDay(ms: number): string {
  const { m, d, w } = jstDate(ms);
  return `${m}月${d}日（${WEEK[w]}）`;
}

// ---- 潮位 ----

/** J2000（2000-01-01 12:00 UTC）からの日数 */
function daysJ2000(ms: number): number {
  return (ms - Date.UTC(2000, 0, 1, 12)) / DAY;
}

/** 天文の引数（度）。T＝平均太陽の時角、s＝月の平均黄経、h＝太陽の平均黄経 */
function args(ms: number) {
  const D = daysJ2000(ms);
  const utcHours = ((ms % DAY) + DAY) % DAY / HOUR;
  const T = 15 * utcHours + 180;
  const s = 218.3165 + 13.17639648 * D;
  const h = 280.4661 + 0.98564736 * D;
  // 月の昇交点黄経 N による振幅の補正 f と位相の補正 u（度）
  const N = (125.0445 - 0.05295377 * D) * RAD;
  const cN = Math.cos(N);
  const sN = Math.sin(N);
  return {
    M2: { v: 2 * T - 2 * s + 2 * h, f: 1.0004 - 0.0373 * cN, u: -2.14 * sN, p: 2 },
    S2: { v: 2 * T, f: 1, u: 0, p: 2 },
    K1: { v: T + h - 90, f: 1.006 + 0.115 * cN, u: -8.86 * sN, p: 1 },
    O1: { v: T - 2 * s + h + 90, f: 1.009 + 0.187 * cN, u: 10.8 * sN, p: 1 },
  };
}

/** その時刻の潮位（cm） */
export function tideLevel(spot: Spot, ms: number): number {
  const a = args(ms);
  const H = spot.harmonics;
  let v = spot.msl;
  for (const k of ["M2", "S2", "K1", "O1"] as const) {
    const c = a[k];
    // 気象庁の遅角 κ を、観測点の経度 λ で G = κ − p·λ に直す
    const G = H[k].phase - c.p * spot.stationLon;
    v += c.f * H[k].amp * Math.cos((c.v + c.u - G) * RAD);
  }
  return v;
}

export type Point = { t: number; h: number };

/** from から to まで、step ごとの潮位 */
export function tideSeries(spot: Spot, from: number, to: number, step = 10 * MINUTE): Point[] {
  const out: Point[] = [];
  for (let t = from; t <= to; t += step) out.push({ t, h: tideLevel(spot, t) });
  return out;
}

export type Extreme = { t: number; h: number; kind: "high" | "low" };

/** 満潮と干潮（1分の細かさで探す） */
export function extremes(spot: Spot, from: number, to: number): Extreme[] {
  const out: Extreme[] = [];
  const step = 5 * MINUTE;
  let prev = tideLevel(spot, from - step);
  let cur = tideLevel(spot, from);
  for (let t = from; t <= to; t += step) {
    const next = tideLevel(spot, t + step);
    const isHigh = cur > prev && cur >= next;
    const isLow = cur < prev && cur <= next;
    if (isHigh || isLow) {
      // 前後5分を1分ごとに見て、いちばん高い（低い）所
      let best = { t, h: cur };
      for (let u = t - step; u <= t + step; u += MINUTE) {
        const v = tideLevel(spot, u);
        if (isHigh ? v > best.h : v < best.h) best = { t: u, h: v };
      }
      out.push({ ...best, kind: isHigh ? "high" : "low" });
    }
    prev = cur;
    cur = next;
  }
  return out;
}

/** 「上げ三分」「下げ七分」「満潮」など。前と次の満干のあいだの、どこにいるか */
export function tideStage(spot: Spot, ms: number): { label: string; rising: boolean } {
  const around = extremes(spot, ms - 14 * HOUR, ms + 14 * HOUR);
  const before = [...around].reverse().find((e) => e.t <= ms);
  const after = around.find((e) => e.t > ms);
  if (!before || !after) return { label: "—", rising: true };
  const rising = before.kind === "low";
  const f = (ms - before.t) / (after.t - before.t);
  const n = Math.round(f * 10);
  if (n <= 0) return { label: rising ? "干潮" : "満潮", rising };
  if (n >= 10) return { label: rising ? "満潮" : "干潮", rising };
  const kan = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return { label: `${rising ? "上げ" : "下げ"}${kan[n]}分`, rising };
}

// ---- 日の出・日の入り ----

export type SunTimes = { dawn: number; rise: number; set: number; dusk: number };

/** 日の出・日の入りと、市民薄明（空が明るみ始める・暗くなりきる）。dayStart は JST の 0時 */
export function sunTimes(lat: number, lon: number, dayStart: number): SunTimes {
  const noon = dayStart + 12 * HOUR;
  const jd = noon / DAY + 2440587.5;
  const n = Math.round(jd - 2451545.0 + 0.0008);
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const L = (M + C + 180 + 102.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
  const sinD = Math.sin(L * RAD) * Math.sin(23.4397 * RAD);
  const cosD = Math.cos(Math.asin(sinD));
  const at = (alt: number, sign: -1 | 1) => {
    const cosW = (Math.sin(alt * RAD) - Math.sin(lat * RAD) * sinD) / (Math.cos(lat * RAD) * cosD);
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / RAD;
    return (Jt + (sign * w) / 360 - 2440587.5) * DAY;
  };
  return { dawn: at(-6, -1), rise: at(-0.833, -1), set: at(-0.833, 1), dusk: at(-6, 1) };
}

// ---- 月齢と潮名 ----

const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** 月齢（0〜29.5） */
export function moonAge(ms: number): number {
  const a = ((ms - NEW_MOON) / DAY) % SYNODIC;
  return a < 0 ? a + SYNODIC : a;
}

export type TideName = "大潮" | "中潮" | "小潮" | "長潮" | "若潮";

/** 月齢から潮名（旧暦の日でおおよそ決める、釣りでよく使う呼び方） */
export function tideName(age: number): TideName {
  const day = (Math.floor(age) % 30) + 1;
  if ([1, 2, 3, 14, 15, 16, 17, 29, 30].includes(day)) return "大潮";
  if ([7, 8, 9, 22, 23, 24].includes(day)) return "小潮";
  if (day === 10 || day === 25) return "長潮";
  if (day === 11 || day === 26) return "若潮";
  return "中潮";
}

const NAME_WEIGHT: Record<TideName, number> = { 大潮: 1, 中潮: 0.9, 小潮: 0.76, 長潮: 0.66, 若潮: 0.72 };

// ---- 時合い ----

export type Window = {
  start: number;
  end: number;
  peak: number;
  /** 0〜100 */
  score: number;
  reason: string;
};

/** 光の重なり（0〜1）。日の出・日の入りの前後75分で高くなる */
export function lightFactor(ms: number, sun: SunTimes): number {
  const d = Math.min(Math.abs(ms - sun.rise), Math.abs(ms - sun.set)) / MINUTE;
  return Math.max(0, 1 - d / 75);
}

/** その日の、10分ごとの時合いの強さ（0〜100） */
export function jiaiCurve(spot: Spot, dayStart: number): Point[] {
  const sun = sunTimes(spot.lat, spot.lon, dayStart);
  const w = NAME_WEIGHT[tideName(moonAge(dayStart + 12 * HOUR))];
  const pts = tideSeries(spot, dayStart, dayStart + DAY, 10 * MINUTE);
  const rates = pts.map((p) => Math.abs(tideLevel(spot, p.t + 15 * MINUTE) - tideLevel(spot, p.t - 15 * MINUTE)) * 2);
  const maxRate = Math.max(...rates, 1e-6);
  return pts.map((p, i) => {
    const rising = tideLevel(spot, p.t + 15 * MINUTE) > tideLevel(spot, p.t - 15 * MINUTE);
    const move = (rates[i] / maxRate) * (rising ? 1 : 0.86);
    const light = lightFactor(p.t, sun);
    return { t: p.t, h: Math.round(100 * w * Math.min(1, 0.62 * move + 0.38 * light + 0.12 * move * light)) };
  });
}

/** 時合いの窓（強い順に最大 max 個）。潮が大きく動く時間と、朝夕のまずめの重なり */
export function jiaiWindows(spot: Spot, dayStart: number, max = 3): Window[] {
  const sun = sunTimes(spot.lat, spot.lon, dayStart);
  const curve = jiaiCurve(spot, dayStart);
  const top = Math.max(...curve.map((p) => p.h));
  const line = Math.max(36, top * 0.7);
  const out: Window[] = [];
  let open: Point[] = [];
  const close = () => {
    if (open.length >= 3) {
      const peak = open.reduce((a, b) => (b.h > a.h ? b : a));
      const rising = tideLevel(spot, peak.t + 15 * MINUTE) > tideLevel(spot, peak.t - 15 * MINUTE);
      const morning = Math.abs(peak.t - sun.rise) <= 90 * MINUTE;
      const evening = Math.abs(peak.t - sun.set) <= 90 * MINUTE;
      const tide = rising ? "上げ潮" : "下げ潮";
      const reason = morning ? `${tide} × 朝まずめ` : evening ? `${tide} × 夕まずめ` : `${tide}の動き`;
      out.push({ start: open[0].t, end: open[open.length - 1].t + 10 * MINUTE, peak: peak.t, score: Math.min(100, Math.round(peak.h)), reason });
    }
    open = [];
  };
  // 線を20分以内だけ下回るすき間は、同じ窓としてつなぐ
  let gap: Point[] = [];
  for (const p of curve) {
    if (p.h >= line) {
      if (open.length && gap.length) open.push(...gap);
      gap = [];
      open.push(p);
    } else if (open.length && gap.length < 2) {
      gap.push(p);
    } else {
      close();
      gap = [];
    }
  }
  close();
  return out.sort((a, b) => b.score - a.score).slice(0, max).sort((a, b) => a.start - b.start);
}

// ---- 撮影（空の色と潮の高さの重なり） ----

export type PhotoMoment = {
  kind: "朝の青" | "夕の青";
  start: number;
  end: number;
  /** その間の潮位の、その日の幅の中での高さ（0＝いちばん低い、100＝いちばん高い） */
  tidePercent: number;
  /** 干潟や潮だまりが空を映しやすい（潮が低い） */
  mirror: boolean;
};

export function photoMoments(spot: Spot, dayStart: number): PhotoMoment[] {
  const sun = sunTimes(spot.lat, spot.lon, dayStart);
  const day = tideSeries(spot, dayStart, dayStart + DAY, 10 * MINUTE).map((p) => p.h);
  const lo = Math.min(...day);
  const hi = Math.max(...day);
  const pct = (a: number, b: number) => Math.round(((tideLevel(spot, (a + b) / 2) - lo) / Math.max(hi - lo, 1e-6)) * 100);
  const make = (kind: PhotoMoment["kind"], start: number, end: number): PhotoMoment => {
    const p = pct(start, end);
    return { kind, start, end, tidePercent: p, mirror: p <= 30 };
  };
  return [make("朝の青", sun.dawn, sun.rise + 20 * MINUTE), make("夕の青", sun.set - 20 * MINUTE, sun.dusk)];
}

// ---- 1日の暦（画面で使うまとめ） ----

export type DayAlmanac = {
  spot: Spot;
  dayStart: number;
  series: Point[];
  extremes: Extreme[];
  sun: SunTimes;
  age: number;
  name: TideName;
  windows: Window[];
  photo: PhotoMoment[];
  range: { lo: number; hi: number };
};

export function dayAlmanac(spot: Spot, dayStart: number): DayAlmanac {
  const series = tideSeries(spot, dayStart, dayStart + DAY, 10 * MINUTE);
  const hs = series.map((p) => p.h);
  const age = moonAge(dayStart + 12 * HOUR);
  return {
    spot,
    dayStart,
    series,
    extremes: extremes(spot, dayStart, dayStart + DAY),
    sun: sunTimes(spot.lat, spot.lon, dayStart),
    age,
    name: tideName(age),
    windows: jiaiWindows(spot, dayStart),
    photo: photoMoments(spot, dayStart),
    range: { lo: Math.min(...hs), hi: Math.max(...hs) },
  };
}
