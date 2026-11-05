// 「わたしの暦」の地点の登録の決まり（入力から結果が決まる物だけ。テストは saved-spots.test.ts）
import { SPOTS } from "./spots";

/** 登録できる地点の数。`PLAN_ROWS` の「保存できる地点」（1地点・12地点）と同じ値 */
export const MAX_SPOTS_FREE = 1;
export const MAX_SPOTS_PRO = 12;

export function spotLimit(pro: boolean): number {
  return pro ? MAX_SPOTS_PRO : MAX_SPOTS_FREE;
}

export type AddCheck = { ok: true } | { ok: false; reason: "unknown" | "duplicate" | "limit" };

/** 地点を足してよいか。saved は登録済みの地点の id */
export function checkAdd(saved: readonly string[], spotId: string, pro: boolean): AddCheck {
  if (!SPOTS.some((s) => s.id === spotId)) return { ok: false, reason: "unknown" };
  if (saved.includes(spotId)) return { ok: false, reason: "duplicate" };
  if (saved.length >= spotLimit(pro)) return { ok: false, reason: "limit" };
  return { ok: true };
}

/**
 * 画面に出す地点。saved は登録の古い順。
 * 有料が切れて上限より多く残った人には、先に登録した分だけ出す（消しはしない）。存在しない id は除く
 */
export function visibleSpotIds(saved: readonly string[], pro: boolean): string[] {
  return saved.filter((id) => SPOTS.some((s) => s.id === id)).slice(0, spotLimit(pro));
}
