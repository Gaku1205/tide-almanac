// 時合いの強さ（0〜100）を、画面に出す短い言葉にする（docs/spec.md「時合いの強さの言葉」。テストは strength.test.ts）

export type Strength = "強" | "並" | "弱";

/** 強とみなす下限 */
export const STRONG_MIN = 70;
/** 並とみなす下限 */
export const FAIR_MIN = 55;

export function strengthOf(score: number): Strength {
  if (score >= STRONG_MIN) return "強";
  if (score >= FAIR_MIN) return "並";
  return "弱";
}

/** 帯の濃さ（CSS のクラス名に使う） */
export function strengthKey(score: number): "strong" | "fair" | "weak" {
  const s = strengthOf(score);
  return s === "強" ? "strong" : s === "並" ? "fair" : "weak";
}
