// 通知の1回分の実行。選び方（planRun）は純粋な関数、DB とメールの出入りは Io に分ける（テストは notify-run.test.ts）
import { HOUR, MINUTE, startOfJstDay } from "./almanac";
import { isPro, type SubscriptionRow } from "./billing";
import { sendMail } from "./mailer";
import { notificationMail } from "./notification-mail";
import { planNotifications, type Notification, type NotificationSettings } from "./notifications";
import { SPOTS } from "./spots";
import { supabaseAdmin } from "./supabase/admin";

/** cron の間隔。前回の実行は、今回のこの分だけ前とみなす */
export const RUN_INTERVAL_MIN = 15;

export type RunUser = {
  id: string;
  email: string | null;
  settings: NotificationSettings;
  /** 会員の契約の行（無ければ null） */
  subscription: SubscriptionRow | null;
  /** 登録した地点の id */
  spotIds: string[];
};

export type Due = { userId: string; email: string; notification: Notification };

/** 送る通知を選ぶ。無料の会員・宛先の無い会員・設定が off の種類は含めない。送る時刻が [now-間隔, now) の物だけ */
export function planRun(users: readonly RunUser[], now: number): Due[] {
  const from = now - RUN_INTERVAL_MIN * MINUTE;
  const today = startOfJstDay(now);
  const out: Due[] = [];
  for (const u of users) {
    if (!u.email || !isPro(u.subscription, new Date(now))) continue;
    if (!u.settings.jiai && !u.settings.lowTide) continue;
    for (const id of u.spotIds) {
      const spot = SPOTS.find((s) => s.id === id);
      if (!spot) continue;
      // 90分前の通知は日付をまたぐことがあるので、今日と明日の両方を見る
      for (const date of [today, today + 24 * HOUR]) {
        for (const n of planNotifications(spot, date, u.settings, from)) {
          if (n.sendAt < now) out.push({ userId: u.id, email: u.email, notification: n });
        }
      }
    }
  }
  return out;
}

export type Io = {
  loadUsers: () => Promise<RunUser[]>;
  /** 送る記録を先に書く。もう書いてあれば false */
  claim: (d: Due) => Promise<boolean>;
  release: (d: Due) => Promise<void>;
  send: (to: string, subject: string, text: string) => Promise<boolean>;
};

export async function runNotify(now: number, io: Io): Promise<{ sent: number; skipped: number; failed: number }> {
  const result = { sent: 0, skipped: 0, failed: 0 };
  for (const d of planRun(await io.loadUsers(), now)) {
    if (!(await io.claim(d))) {
      result.skipped++;
      continue;
    }
    const mail = notificationMail(d.notification);
    if (await io.send(d.email, mail.subject, mail.text)) result.sent++;
    else {
      result.failed++;
      await io.release(d);
    }
  }
  return result;
}

type SettingsRow = { user_id: string; jiai_enabled: boolean; low_tide_enabled: boolean; low_tide_threshold_cm: number };

/** 本番の出入り（supabaseAdmin とメール） */
export function supabaseIo(): Io {
  const admin = supabaseAdmin();
  return {
    async loadUsers() {
      const { data: rows } = await admin
        .from("notification_settings")
        .select("user_id, jiai_enabled, low_tide_enabled, low_tide_threshold_cm")
        .or("jiai_enabled.eq.true,low_tide_enabled.eq.true");
      const users: RunUser[] = [];
      for (const r of (rows ?? []) as SettingsRow[]) {
        const [{ data: subs }, { data: spots }, { data: auth }] = await Promise.all([
          admin.from("subscriptions").select("status, current_period_end, cancel_at_period_end").eq("user_id", r.user_id),
          admin.from("saved_spots").select("spot_id").eq("user_id", r.user_id).order("created_at"),
          admin.auth.admin.getUserById(r.user_id),
        ]);
        const list = (subs ?? []) as SubscriptionRow[];
        users.push({
          id: r.user_id,
          email: auth?.user?.email ?? null,
          settings: { jiai: r.jiai_enabled, lowTide: r.low_tide_enabled, thresholdCm: r.low_tide_threshold_cm },
          subscription: list.find((s) => isPro(s)) ?? list[0] ?? null,
          spotIds: ((spots ?? []) as { spot_id: string }[]).map((s) => s.spot_id),
        });
      }
      return users;
    },
    async claim(d) {
      const { error } = await admin.from("notification_log").insert(key(d));
      return !error;
    },
    async release(d) {
      await admin.from("notification_log").delete().match(key(d));
    },
    send: (to, subject, text) => sendMail({ to, subject, text }),
  };
}

function key(d: Due) {
  return { user_id: d.userId, spot_id: d.notification.spotId, kind: d.notification.kind, send_at: new Date(d.notification.sendAt).toISOString() };
}
