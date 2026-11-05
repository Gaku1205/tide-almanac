import { describe, expect, it } from "vitest";
import { HOUR, jstDayStart } from "./almanac";
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
  it("前回の実行より前・今回より後に送る物は選ばない", () => {
    expect(planRun([user()], jstDayStart(2026, 11, 5) + 22 * HOUR)).toEqual([]);
    expect(planRun([user()], jstDayStart(2026, 11, 5) + 20 * HOUR)).toEqual([]);
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
