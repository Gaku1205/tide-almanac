import { describe, expect, it } from "vitest";
import { HOUR, jiaiWindows, jstDayStart } from "./almanac";
import { BEFORE_MINUTES } from "./notifications";
import { SPOTS } from "./spots";
import { planRun, runNotify, type Due, type Io, type RunUser } from "./notify-run";

const on = { jiai: true, lowTide: false, thresholdCm: 30 };
const active = { status: "active", current_period_end: null };
const canceled = { status: "canceled", current_period_end: null };
// 前の晩21時の実行（21:05 JST）
const now = jstDayStart(2026, 11, 5) + 21 * HOUR + 5 * 60_000;

function user(over: Partial<RunUser> = {}): RunUser {
  return { id: "u1", email: "a@example.com", settings: on, subscription: active, spotIds: ["jogashima"], ...over };
}

describe("planRun", () => {
  it("設定が on の有料会員に、前の晩21時の時合いを選ぶ", () => {
    const list = planRun([user()], now);
    expect(list.some((d) => d.notification.kind === "jiai-evening")).toBe(true);
    expect(list.every((d) => d.userId === "u1")).toBe(true);
  });
  it("無料に戻った会員・契約の無い会員には選ばない", () => {
    expect(planRun([user({ subscription: canceled })], now)).toEqual([]);
    expect(planRun([user({ subscription: null })], now)).toEqual([]);
  });
  it("設定が off の種類・宛先の無い会員・不明な地点は選ばない", () => {
    expect(planRun([user({ settings: { ...on, jiai: false } })], now)).toEqual([]);
    expect(planRun([user({ email: null })], now)).toEqual([]);
    expect(planRun([user({ spotIds: ["nowhere"] })], now)).toEqual([]);
  });
  it("今日の21:00より前に呼ばれたら、まだ送らない", () => {
    expect(planRun([user()], jstDayStart(2026, 11, 5) + 20 * HOUR)).toEqual([]);
    expect(planRun([user()], jstDayStart(2026, 11, 5) + 20 * HOUR + 59 * 60_000)).toEqual([]);
  });
  it("21:00・21:20・21:59 のどれで呼ばれても、前の晩の時合いと干潮を選ぶ", () => {
    const both = user({ settings: { jiai: true, lowTide: true, thresholdCm: 200 } });
    for (const min of [0, 20, 59]) {
      const list = planRun([both], jstDayStart(2026, 11, 5) + 21 * HOUR + min * 60_000);
      const kinds = new Set(list.map((d) => d.notification.kind));
      expect(kinds.has("jiai-evening")).toBe(true);
      expect(kinds.has("low-tide")).toBe(true);
      expect(kinds.has("jiai-before")).toBe(false);
    }
  });
  it("90分前の通知は、送る時刻が 20:50 になる時合いでも、呼ばれる時刻によらず選ばない", () => {
    const spot = SPOTS[0];
    // 90分前が 20:45〜21:00 JST に入る時合いのある日を探す
    let day = jstDayStart(2026, 1, 1);
    let found = false;
    for (let i = 0; i < 365 && !found; i++, day += 24 * HOUR) {
      const hit = jiaiWindows(spot, day).find((w) => {
        const b = w.start - BEFORE_MINUTES * 60_000 - day;
        return b >= 20 * HOUR + 45 * 60_000 && b <= 21 * HOUR;
      });
      if (!hit) continue;
      found = true;
      for (const t of [20 * HOUR + 45 * 60_000, 20 * HOUR + 50 * 60_000, 21 * HOUR, 21 * HOUR + 20 * 60_000, 21 * HOUR + 59 * 60_000]) {
        const list = planRun([user({ spotIds: [spot.id] })], day + t);
        expect(list.some((d) => d.notification.kind === "jiai-before")).toBe(false);
      }
    }
    expect(found).toBe(true);
  });
});

function memoryIo(users: RunUser[], failSend = false) {
  const log = new Set<string>();
  const mails: string[] = [];
  const k = (d: Due) => [d.userId, d.notification.spotId, d.notification.kind, d.notification.sendAt].join("|");
  const io: Io = {
    loadUsers: async () => users,
    claim: async (d) => (log.has(k(d)) ? false : (log.add(k(d)), true)),
    release: async (d) => void log.delete(k(d)),
    send: async (to) => (failSend ? false : (mails.push(to), true)),
  };
  return { io, mails, log };
}

describe("runNotify", () => {
  it("同じ通知は、実行が重なっても二重に送らない", async () => {
    const { io, mails } = memoryIo([user()]);
    const first = await runNotify(now, io);
    const again = await runNotify(now + 60_000, io);
    expect(first.sent).toBeGreaterThan(0);
    expect(again.sent).toBe(0);
    expect(again.skipped).toBe(first.sent);
    expect(mails).toHaveLength(first.sent);
  });
  it("cron が同じ日に2回動いても（21:00 と 21:40）、二重に送らない", async () => {
    const { io, mails } = memoryIo([user({ settings: { jiai: true, lowTide: true, thresholdCm: 200 } })]);
    const first = await runNotify(now - 5 * 60_000, io);
    const second = await runNotify(now + 35 * 60_000, io);
    expect(first.sent).toBeGreaterThan(0);
    expect(second.sent).toBe(0);
    expect(second.skipped).toBe(first.sent);
    expect(mails).toHaveLength(first.sent);
  });
  it("無料に戻った会員には送らない", async () => {
    const { io, mails } = memoryIo([user({ subscription: canceled })]);
    expect((await runNotify(now, io)).sent).toBe(0);
    expect(mails).toEqual([]);
  });
  it("送るのに失敗したら記録を消す", async () => {
    const { io, log } = memoryIo([user()], true);
    const r = await runNotify(now, io);
    expect(r.failed).toBeGreaterThan(0);
    expect(log.size).toBe(0);
  });
});
