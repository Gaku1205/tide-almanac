import { describe, expect, it } from "vitest";
import { areaPath, band, extSpan, frameFor, linePath, mobileTags, pct, x, y } from "./chart";

const pts = [
  { t: 0, h: 50 },
  { t: 50, h: 150 },
  { t: 100, h: 50 },
];
const f = frameFor(pts, 0, 100, 1000, 300);

describe("潮汐曲線の座標", () => {
  it("時刻は左から右へ、潮位は下から上へ", () => {
    expect(x(f, 0)).toBe(0);
    expect(x(f, 100)).toBe(1000);
    expect(y(f, 150)).toBeLessThan(y(f, 50));
    expect(y(f, f.lo)).toBe(300);
  });
  it("上に札の余白がある", () => {
    expect(f.hi).toBeGreaterThan(150);
    expect(f.hi - 150).toBeGreaterThan(50 - f.lo);
  });
  it("線と面の path", () => {
    expect(linePath(f, pts).startsWith("M0 ")).toBe(true);
    expect(linePath(f, pts).split("L").length).toBe(3);
    expect(areaPath(f, pts).endsWith("Z")).toBe(true);
    expect(areaPath(f, [])).toBe("");
  });
  it("帯は枠からはみ出さない", () => {
    expect(band(f, -20, 30)).toEqual({ x: 0, w: 300 });
    expect(band(f, 90, 140)).toEqual({ x: 900, w: 100 });
    expect(pct(f, 50).left).toBe(50);
  });
});

describe("スマホの札の置き場所", () => {
  it("干潮の札と近い「いま」の札は、反対側か、無ければ省く", () => {
    expect(mobileTags({ highs: [], lows: [90], now: 70, best: null }).nowTag).toBe("left");
    expect(mobileTags({ highs: [], lows: [85, 60], now: 72, best: null }).nowTag).toBe("none");
    expect(mobileTags({ highs: [], lows: [20], now: 60, best: null }).nowTag).toBe("right");
  });
  it("「時合い」の札は「いま」の線と干潮・満潮の札を避ける", () => {
    const t = mobileTags({ highs: [30], lows: [85], now: 75, best: 76 });
    expect(t.jiai).not.toBeNull();
    const j = t.jiai!;
    expect(Math.abs(j.left - 75)).toBeGreaterThanOrEqual(14 + 3);
    expect(j.left).toBeGreaterThanOrEqual(14);
    expect(j.left).toBeLessThanOrEqual(86);
    const own = extSpan(j.row === "top" ? 30 : 85);
    expect(j.left + 14 <= own.a || j.left - 14 >= own.b).toBe(true);
  });
  it("近くに何も無ければ時合いの札は元の位置の下段", () => {
    expect(mobileTags({ highs: [20], lows: [70], now: null, best: 40 }).jiai).toEqual({ row: "bottom", left: 40 });
  });
  it("端の札は内側へ寄る", () => {
    expect(extSpan(3)).toEqual({ a: 3, b: 19 });
    expect(extSpan(97)).toEqual({ a: 81, b: 97 });
  });
});
