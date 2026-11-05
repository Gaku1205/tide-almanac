import { describe, expect, it } from "vitest";
import { MAX_SPOTS_FREE, MAX_SPOTS_PRO, checkAdd, spotLimit, visibleSpotIds } from "./saved-spots";
import { PLAN_ROWS } from "./plan";

describe("上限", () => {
  it("無料 1・有料 12", () => {
    expect(spotLimit(false)).toBe(1);
    expect(spotLimit(true)).toBe(12);
  });
  it("料金の表の「保存できる地点」と同じ", () => {
    const row = PLAN_ROWS.find((r) => r.label === "保存できる地点");
    expect(row?.free).toBe(`${MAX_SPOTS_FREE}地点`);
    expect(row?.pro).toBe(`${MAX_SPOTS_PRO}地点`);
  });
});

describe("checkAdd", () => {
  it("空なら足せる", () => {
    expect(checkAdd([], "jogashima", false).ok).toBe(true);
  });
  it("存在しない地点は断る", () => {
    expect(checkAdd([], "nowhere", true)).toEqual({ ok: false, reason: "unknown" });
  });
  it("同じ地点は二重に足せない", () => {
    expect(checkAdd(["jogashima"], "jogashima", true)).toEqual({ ok: false, reason: "duplicate" });
  });
  it("無料は2地点目を断る", () => {
    expect(checkAdd(["jogashima"], "enoshima", false)).toEqual({ ok: false, reason: "limit" });
  });
  it("有料は2地点目を足せる", () => {
    expect(checkAdd(["jogashima"], "enoshima", true).ok).toBe(true);
  });
  it("有料は上限ちょうどで断る", () => {
    const full = Array.from({ length: MAX_SPOTS_PRO }, (_, i) => `spot-${i}`);
    expect(checkAdd(full, "jogashima", true)).toEqual({ ok: false, reason: "limit" });
    expect(checkAdd(full.slice(1), "jogashima", true).ok).toBe(true);
  });
  it("有料が切れて多く残った人は足せない", () => {
    expect(checkAdd(["jogashima", "enoshima", "sunosaki"], "irago", false)).toEqual({ ok: false, reason: "limit" });
  });
});

describe("visibleSpotIds", () => {
  it("有料はすべて出す", () => {
    expect(visibleSpotIds(["jogashima", "enoshima"], true)).toEqual(["jogashima", "enoshima"]);
  });
  it("無料は先に登録した1地点だけ", () => {
    expect(visibleSpotIds(["jogashima", "enoshima"], false)).toEqual(["jogashima"]);
  });
  it("存在しない id は除く", () => {
    expect(visibleSpotIds(["gone", "enoshima"], false)).toEqual(["enoshima"]);
  });
});
