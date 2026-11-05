// 通知メールの件名と本文（純粋な関数。テストは notification-mail.test.ts）
import { hm, jpDay } from "./almanac";
import type { Notification } from "./notifications";
import { spotById } from "./spots";

export type MailContent = { subject: string; text: string };

const FOOT = "※潮位は天文の推算値です。海に出る判断は現地の情報と合わせて行ってください。";

export function notificationMail(n: Notification): MailContent {
  const name = spotById(n.spotId).name;
  if (n.kind === "low-tide" && n.low) {
    return {
      subject: `【潮汐暦】${name} 明日の朝は干潮が低めです`,
      text: `${name}の${jpDay(n.low.t)}の干潮は ${hm(n.low.t)} に ${Math.round(n.low.h)}cm（推算値）です。\n\n${FOOT}`,
    };
  }
  const w = n.window;
  const range = w ? `${hm(w.start)}〜${hm(w.end)}` : "";
  const peak = w ? hm(w.peak) : "";
  const reason = w ? `\n${w.reason}` : "";
  if (n.kind === "jiai-before") {
    return {
      subject: `【潮汐暦】${name} 時合いまであと90分（${w ? hm(w.start) : ""}から）`,
      text: `${name}の時合いが ${range} に始まります（ピーク ${peak}）。${reason}\n\n${FOOT}`,
    };
  }
  return {
    subject: `【潮汐暦】${name} 明日いちばんの時合い ${range}`,
    text: `${name}の明日いちばんの時合いは ${range}（ピーク ${peak}）です。${reason}\n\n${FOOT}`,
  };
}
