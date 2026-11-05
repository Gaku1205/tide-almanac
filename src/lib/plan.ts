// 無料と有料の分け方（画面に出す文言と数）。値段は factory-price.txt と Stripe の値段に合わせる

/** 月額（円） */
export const PRICE_YEN = 480;

export type PlanRow = { label: string; free: string; pro: string };

/** 料金の画面の比較表 */
export const PLAN_ROWS: PlanRow[] = [
  { label: "保存できる地点", free: "1地点", pro: "12地点" },
  { label: "暦の先読み", free: "今日と明日", pro: "30日先まで" },
  { label: "潮汐曲線・満潮と干潮", free: "○", pro: "○" },
  { label: "日の出入り・月齢・潮名", free: "○", pro: "○" },
  { label: "時合いの予告（強さつき）", free: "○", pro: "○" },
  { label: "地点の比較（同じ日を横に並べる）", free: "—", pro: "○" },
  { label: "時合いの通知（前の晩・90分前）", free: "—", pro: "○" },
  { label: "干潮の通知（決めた高さを下回る朝）", free: "—", pro: "○" },
  { label: "撮影の「青い時間」×潮の高さ", free: "今日だけ", pro: "30日先まで" },
];
