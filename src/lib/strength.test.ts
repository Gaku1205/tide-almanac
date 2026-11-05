import { describe, expect, it } from "vitest";
import { strengthKey, strengthOf } from "./strength";

describe("strengthOf", () => {
  it("70 以上は強、55 以上は並、それより下は弱", () => {
    expect(strengthOf(100)).toBe("強");
    expect(strengthOf(70)).toBe("強");
    expect(strengthOf(69)).toBe("並");
    expect(strengthOf(55)).toBe("並");
    expect(strengthOf(54)).toBe("弱");
    expect(strengthOf(0)).toBe("弱");
  });
  it("strengthKey は言葉と同じ区切り", () => {
    expect([80, 60, 40].map(strengthKey)).toEqual(["strong", "fair", "weak"]);
  });
});
