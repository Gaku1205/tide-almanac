// 潮汐曲線の図の座標（入力から出力が決まる物だけ。テストは chart.test.ts）
import type { Point } from "./almanac";

export type Frame = { from: number; to: number; lo: number; hi: number; w: number; h: number };

/** 潮位の幅に、上下の余白（上は札を置くので広め）を足した枠 */
export function frameFor(points: Point[], from: number, to: number, w = 1000, h = 300): Frame {
  const hs = points.map((p) => p.h);
  const lo = Math.min(...hs);
  const hi = Math.max(...hs);
  const span = Math.max(hi - lo, 10);
  return { from, to, lo: lo - span * 0.18, hi: hi + span * 0.34, w, h };
}

export function x(f: Frame, t: number): number {
  return ((t - f.from) / (f.to - f.from)) * f.w;
}

export function y(f: Frame, v: number): number {
  return f.h - ((v - f.lo) / (f.hi - f.lo)) * f.h;
}

/** 枠の中での位置（%）。札を HTML で重ねるため */
export function pct(f: Frame, t: number, v?: number): { left: number; top: number } {
  return { left: (x(f, t) / f.w) * 100, top: v === undefined ? 0 : (y(f, v) / f.h) * 100 };
}

const r = (n: number) => Math.round(n * 10) / 10;

export function linePath(f: Frame, points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${r(x(f, p.t))} ${r(y(f, p.h))}`).join(" ");
}

export function areaPath(f: Frame, points: Point[]): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(f, points)} L${r(x(f, last.t))} ${f.h} L${r(x(f, first.t))} ${f.h} Z`;
}

/** 時刻の帯（start〜end）を、枠の中に収めた x と幅 */
export function band(f: Frame, start: number, end: number): { x: number; w: number } {
  const a = Math.max(0, Math.min(f.w, x(f, start)));
  const b = Math.max(0, Math.min(f.w, x(f, end)));
  return { x: r(a), w: r(Math.max(0, b - a)) };
}

/* ---- スマホ（390px 幅）の札の置き場所。幅は図の幅に対する % で、390px 幅の図（約 350px）を基準にする ---- */
export type Span = { a: number; b: number };

/** 満潮・干潮の札（丸＋時刻）が占める横の範囲。端では内側へ寄せて置く（TideChart の alignL / alignR と同じ） */
export function extSpan(left: number): Span {
  const half = 8;
  if (left < 7) return { a: left, b: left + 2 * half };
  if (left > 93) return { a: left - 2 * half, b: left };
  return { a: left - half, b: left + half };
}

const NOW_TAG_W = 22; // 「いま 18:08」の札（線の横 6px から）
const NOW_LINE_HALF = 3; // 「いま」の線と点
const JIAI_HALF = 14; // 「時合い 並」の札の半分
const GAP = 2;

export type MobileTags = {
  /** 「いま」の札：線の右、左、または省く */
  nowTag: "right" | "left" | "none";
  /** 「時合い」の札を置く段と、中心の位置（%）。置けなければ null */
  jiai: { row: "top" | "bottom"; left: number } | null;
};

const clear = (a: Span, b: Span) => a.b + GAP <= b.a || b.b + GAP <= a.a;

/**
 * 640px 以下で、曲線の上の札が重ならない置き方を決める。
 * 満潮・干潮の札は常に出す。「いま」の札は、干潮の札（下）と近ければ反対側に、どちらも近ければ省く。
 * 「時合い」の札は、満潮の札（上）か干潮・「いま」の札（下）に重ならない段へ置き、「いま」の線を避けて横にずらす。
 */
export function mobileTags(input: { highs: number[]; lows: number[]; now: number | null; best: number | null }): MobileTags {
  const highs = input.highs.map(extSpan);
  const lows = input.lows.map(extSpan);

  let nowTag: MobileTags["nowTag"] = "none";
  let nowTagSpan: Span | null = null;
  const line: Span | null = input.now === null ? null : { a: input.now - NOW_LINE_HALF, b: input.now + NOW_LINE_HALF };
  if (input.now !== null) {
    const right: Span = { a: input.now, b: input.now + NOW_TAG_W };
    const left: Span = { a: input.now - NOW_TAG_W, b: input.now };
    if (right.b <= 100 && lows.every((l) => clear(right, l))) {
      nowTag = "right";
      nowTagSpan = right;
    } else if (left.a >= 0 && lows.every((l) => clear(left, l))) {
      nowTag = "left";
      nowTagSpan = left;
    }
  }

  if (input.best === null) return { nowTag, jiai: null };
  const best = input.best;

  const place = (row: "top" | "bottom"): number | null => {
    const obstacles: Span[] = [...(row === "top" ? highs : lows)];
    if (line) obstacles.push(line);
    if (row === "bottom" && nowTagSpan) obstacles.push(nowTagSpan);
    const fits = (c: number) => c >= JIAI_HALF && c <= 100 - JIAI_HALF && obstacles.every((o) => clear({ a: c - JIAI_HALF, b: c + JIAI_HALF }, o));
    const candidates = [best, ...obstacles.flatMap((o) => [o.a - GAP - JIAI_HALF, o.b + GAP + JIAI_HALF])].filter(fits);
    if (candidates.length === 0) return null;
    return candidates.reduce((m, c) => (Math.abs(c - best) < Math.abs(m - best) ? c : m));
  };
  let pick: { row: "top" | "bottom"; left: number } | null = null;
  for (const row of ["bottom", "top"] as const) {
    const c = place(row);
    if (c === null) continue;
    if (!pick || Math.abs(c - best) < Math.abs(pick.left - best) - 0.5) pick = { row, left: c };
  }
  return { nowTag, jiai: pick };
}
