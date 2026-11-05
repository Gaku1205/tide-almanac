// トップ（/）の分け方：日付の切り替え（?d=）・鍵つきの日・比較の表の行（docs/spec.md「トップ」。テストは home.test.ts）
// 有料かどうかは、呼ぶ側（ページ）がサーバーで `getViewer().pro` から渡す。
import { DAY_MS, dayAlmanac, jstDate, type DayAlmanac, type Spot, type Window } from "./almanac";

/** 無料で選べる日（今日から何日先まで。今日と明日） */
export const HOME_DAYS_FREE = 1;
/** 有料で選べる日（今日から何日先まで） */
export const HOME_DAYS_PRO = 5;

export function homeDays(pro: boolean): number {
  return pro ? HOME_DAYS_PRO : HOME_DAYS_FREE;
}

/** その日（今日からの日数）が、この人には鍵つきか */
export function isDayLocked(offset: number, pro: boolean): boolean {
  return offset > homeDays(pro);
}

/** ?d= を今日からの日数にする。無い・数字でない・範囲の外・鍵つきの日は今日（0） */
export function parseDayOffset(raw: string | undefined, pro: boolean): number {
  if (raw === undefined || !/^[0-9]$/.test(raw)) return 0;
  const n = Number(raw);
  if (n > HOME_DAYS_PRO || isDayLocked(n, pro)) return 0;
  return n;
}

/** トップへのリンク。既定の値（日付 0・空の検索語）は URL に入れない */
export function homeHref({ spot, q, d }: { spot?: string; q?: string; d?: number }): string {
  const p = new URLSearchParams();
  if (spot) p.set("spot", spot);
  if (d) p.set("d", String(d));
  if (q) p.set("q", q);
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

export type DayChip = {
  offset: number;
  dayStart: number;
  /** 「今日」「明日」「7日」 */
  label: string;
  locked: boolean;
  /** 押した先。鍵つきは /pricing */
  href: string;
};

/** 上の帯の日付の切り替え（今日〜5日先） */
export function dayChips(today: number, pro: boolean, base: { spot?: string; q?: string }): DayChip[] {
  return Array.from({ length: HOME_DAYS_PRO + 1 }, (_, offset) => {
    const dayStart = today + offset * DAY_MS;
    const locked = isDayLocked(offset, pro);
    const label = offset === 0 ? "今日" : offset === 1 ? "明日" : `${jstDate(dayStart).d}日`;
    return { offset, dayStart, label, locked, href: locked ? "/pricing" : homeHref({ ...base, d: offset }) };
  });
}

export type PreviewDay = { offset: number; dayStart: number; locked: boolean };

/** 「明日以降」の5枚（明日〜5日先）。鍵つきの日は中身を作らない（呼ぶ側は locked を見て暦を計算しない） */
export function previewDays(today: number, pro: boolean): PreviewDay[] {
  return Array.from({ length: HOME_DAYS_PRO }, (_, i) => {
    const offset = i + 1;
    return { offset, dayStart: today + offset * DAY_MS, locked: isDayLocked(offset, pro) };
  });
}

/** その日のいちばん強い時合い（同じ強さなら早い方）。無ければ null */
export function bestWindow(windows: Window[]): Window | null {
  return windows.reduce<Window | null>((m, w) => (m === null || w.score > m.score ? w : m), null);
}

export type CompareRow = { d: DayAlmanac; best: Window | null };

/** 地点を、いちばん強い時合いの強さの順に（時合いの無い地点は最後） */
export function rankSpots(spots: Spot[], dayStart: number): CompareRow[] {
  return spots
    .map((sp) => {
      const d = dayAlmanac(sp, dayStart);
      return { d, best: bestWindow(d.windows) };
    })
    .sort((x, y) => (y.best?.score ?? -1) - (x.best?.score ?? -1));
}

/** 比較の表：無料は1位の1行だけ、残りは鍵つきの行の数だけ返す（中身は作らない） */
export function compareRows(spots: Spot[], dayStart: number, pro: boolean): { rows: CompareRow[]; locked: number } {
  if (pro) return { rows: rankSpots(spots, dayStart), locked: 0 };
  // 無料でも1位を決めるには全地点を比べる必要があるが、返すのは1行だけ
  const ranked = rankSpots(spots, dayStart);
  return { rows: ranked.slice(0, 1), locked: Math.max(0, ranked.length - 1) };
}

/** 何枚かの曲線の潮位の物差し（cm） */
export function sharedDomain(days: DayAlmanac[]): { lo: number; hi: number } | undefined {
  if (days.length === 0) return undefined;
  return { lo: Math.min(...days.map((d) => d.range.lo)), hi: Math.max(...days.map((d) => d.range.hi)) };
}
