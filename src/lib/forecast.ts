// 「わたしの暦」の先読み（30日先までの暦と、撮影の「青い時間」×潮の高さ。テストは forecast.test.ts）
// 有料かどうかの判定は呼ぶ側がサーバーで `getViewer().pro` から渡す。
import { DAY_MS, HOUR, jiaiWindows, moonAge, photoMoments, tideName, type PhotoMoment, type Spot, type TideName, type Window } from "./almanac";

/** 有料で先読みできる日数（今日から数えて何日先まで。今日と30日先の両方を含む） */
export const FORECAST_DAYS_PRO = 30;
/** 無料で見られる日数（今日から数えて何日先まで。今日と明日） */
export const FORECAST_DAYS_FREE = 1;

export function forecastDays(pro: boolean): number {
  return pro ? FORECAST_DAYS_PRO : FORECAST_DAYS_FREE;
}

/** 見られる日の JST 0時の並び。today は今日の JST 0時 */
export function forecastDayStarts(today: number, pro: boolean): number[] {
  return Array.from({ length: forecastDays(pro) + 1 }, (_, i) => today + i * DAY_MS);
}

export type CalendarRow = {
  dayStart: number;
  name: TideName;
  /** その日のいちばん強い時合い。無い日は null */
  best: Window | null;
};

/** 日ごとの潮名と、いちばん強い時合い（強さが同じなら早い方） */
export function calendarRows(spot: Spot, today: number, pro: boolean): CalendarRow[] {
  return forecastDayStarts(today, pro).map((dayStart) => {
    const windows = jiaiWindows(spot, dayStart);
    const best = windows.reduce<Window | null>((m, w) => (m === null || w.score > m.score ? w : m), null);
    return { dayStart, name: tideName(moonAge(dayStart + 12 * HOUR)), best };
  });
}

export type PhotoMorning = { dayStart: number; moment: PhotoMoment };

/** 朝の「青い時間」と潮の低さ（干潟が空を映す）が重なる朝。日付の順 */
export function photoMornings(spot: Spot, today: number, pro: boolean): PhotoMorning[] {
  const out: PhotoMorning[] = [];
  for (const dayStart of forecastDayStarts(today, pro)) {
    const moment = photoMoments(spot, dayStart).find((m) => m.kind === "朝の青");
    if (moment?.mirror) out.push({ dayStart, moment });
  }
  return out;
}

/** 無料に見せる撮影の「青い時間」：今日だけ（朝と夕） */
export function photoToday(spot: Spot, today: number): PhotoMoment[] {
  return photoMoments(spot, today);
}
