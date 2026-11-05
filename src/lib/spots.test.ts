import { describe, expect, it } from "vitest";
import { SPOTS, searchSpots, spotById } from "./spots";

describe("searchSpots", () => {
  it("未指定・空・空白だけなら全地点", () => {
    expect(searchSpots(undefined)).toEqual(SPOTS);
    expect(searchSpots("")).toEqual(SPOTS);
    expect(searchSpots("  ")).toEqual(SPOTS);
  });
  it("地点名の部分一致", () => {
    expect(searchSpots("江").map((s) => s.id)).toEqual(["enoshima"]);
    expect(searchSpots("伊良").map((s) => s.id)).toEqual(["irago"]);
  });
  it("地域の部分一致", () => {
    expect(searchSpots("神奈川").map((s) => s.id)).toEqual(["jogashima", "enoshima"]);
    expect(searchSpots("千葉").map((s) => s.id)).toEqual(["sunosaki"]);
  });
  it("前後の空白は無視する", () => {
    expect(searchSpots(" 串本 ").map((s) => s.id)).toEqual(["kushimoto"]);
  });
  it("0件なら空の配列", () => {
    expect(searchSpots("北海道")).toEqual([]);
  });
});

describe("spotById", () => {
  it("id に合う地点を返す", () => {
    expect(spotById("oura").name).toBe("大浦");
  });
  it("未指定・不明な id は城ヶ島", () => {
    expect(spotById(undefined).id).toBe("jogashima");
    expect(spotById("nowhere").id).toBe("jogashima");
    expect(spotById("").id).toBe("jogashima");
  });
});
