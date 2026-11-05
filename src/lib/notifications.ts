// 通知の決まり（入力から出力が決まる物だけ。テストは notifications.test.ts）。実際の送信は含まない。
// 時刻はすべて UTC のミリ秒で持ち、「前の晩21時」などは日本時間（JST）で数える。
import { extremes, HOUR, jiaiWindows, MINUTE, type Spot, type Window } from "./almanac";

export const THRESHOLD_MIN = 0;
export const THRESHOLD_MAX = 200;
export const THRESHOLD_DEFAULT = 30;
/** 前の晩に送る時刻（JST の時） */
export const EVENING_HOUR = 21;
/** 時合い開始の何分前に送るか */
export const BEFORE_MINUTES = 90;
/** 干潮の通知で「翌朝」とみなす範囲（その日の 0時〜正午。JST） */
const MORNING_END = 12 * HOUR;

export type NotificationSettings = {
  /** 時合いの通知（前の晩21時と90分前をまとめて切り替える） */
  jiai: boolean;
  /** 干潮の通知 */
  lowTide: boolean;
  /** 干潮のしきい値（cm）。これを下回る朝に送る */
  thresholdCm: number;
};

export const DEFAULT_SETTINGS: NotificationSettings = { jiai: false, lowTide: false, thresholdCm: THRESHOLD_DEFAULT };

/** しきい値の入力。0〜200 の整数だけ通す。それ以外は null */
export function parseThreshold(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n >= THRESHOLD_MIN && n <= THRESHOLD_MAX ? n : null;
}

export type NotificationKind = "jiai-evening" | "jiai-before" | "low-tide";

export type Notification = {
  kind: NotificationKind;
  spotId: string;
  /** 送る時刻 */
  sendAt: number;
  /** 時合いの通知で、知らせる時合い */
  window?: Window;
  /** 干潮の通知で、知らせる干潮の時刻と潮位（cm） */
  low?: { t: number; h: number };
};

/**
 * 送る通知の一覧（送る時刻の早い順）。
 * - date：知らせる日の JST 0時（「明日」の日付）。前の晩21時はその前日の21時
 * - now：現在時刻。送る時刻がすでに過ぎた物は返さない
 * - 時合い：前の晩21時は、その日のいちばん強い時合いについて1通。90分前は、時合いごとに1通
 * - 干潮：date の 0時〜正午の干潮がしきい値を「下回る」とき、前の晩21時に1通
 * - 設定が off の物は返さない
 */
export function planNotifications(spot: Spot, date: number, settings: NotificationSettings, now: number): Notification[] {
  const evening = date - 24 * HOUR + EVENING_HOUR * HOUR;
  const out: Notification[] = [];
  if (settings.jiai) {
    const windows = jiaiWindows(spot, date);
    const best = windows.reduce<Window | undefined>((a, w) => (!a || w.score > a.score ? w : a), undefined);
    if (best) out.push({ kind: "jiai-evening", spotId: spot.id, sendAt: evening, window: best });
    for (const w of windows) out.push({ kind: "jiai-before", spotId: spot.id, sendAt: w.start - BEFORE_MINUTES * MINUTE, window: w });
  }
  if (settings.lowTide) {
    for (const e of extremes(spot, date, date + MORNING_END)) {
      if (e.kind === "low" && e.h < settings.thresholdCm) out.push({ kind: "low-tide", spotId: spot.id, sendAt: evening, low: { t: e.t, h: e.h } });
    }
  }
  return out.filter((n) => n.sendAt >= now).sort((a, b) => a.sendAt - b.sendAt);
}
