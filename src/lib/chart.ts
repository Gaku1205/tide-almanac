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
