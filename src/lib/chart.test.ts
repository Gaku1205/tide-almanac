import { describe, expect, it } from "vitest";
import { areaPath, band, frameFor, linePath, pct, x, y } from "./chart";

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
