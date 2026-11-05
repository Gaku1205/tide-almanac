import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { billingEnabled } from "@/lib/env";
import { planLabel } from "@/lib/billing";
import { PRICE_YEN } from "@/lib/plan";
import { DEFAULT_SETTINGS, THRESHOLD_MAX, THRESHOLD_MIN, type NotificationSettings } from "@/lib/notifications";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { saveNotificationSettings } from "./actions";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import s from "@/components/member.module.css";

export const metadata: Metadata = { title: "アカウント" };

const NOTICE: Record<string, string> = {
  saved: "通知の設定を保存しました。",
  invalid: "しきい値は 0〜200 の整数で入れてください。保存していません。",
  pro: "通知の設定は有料プランの機能です。",
  fail: "保存できませんでした。時間をおいて、もう一度お試しください。",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; n?: string }> }) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/account");
  const { ok, n } = await searchParams;
  const canPay = billingEnabled();
  let settings: NotificationSettings = DEFAULT_SETTINGS;
  if (viewer.pro) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("notification_settings")
      .select("jiai_enabled, low_tide_enabled, low_tide_threshold_cm")
      .eq("user_id", viewer.user.id)
      .maybeSingle();
    if (data) settings = { jiai: Boolean(data.jiai_enabled), lowTide: Boolean(data.low_tide_enabled), thresholdCm: Number(data.low_tide_threshold_cm) };
  }
  return (
    <>
      <SiteHeader tone="paper" />
      <main className={s.page}>
        <div className={s.pageInner}>
          <h1 className={s.title}>アカウント</h1>
          {ok === "1" && !viewer.pro ? <p className={s.note}>支払いを受け付けました。反映まで数秒かかります。少し待ってから開き直してください。</p> : null}

          <dl className={s.list}>
            <div>
              <dt>メールアドレス</dt>
              <dd>{viewer.user.email}</dd>
            </div>
            <div>
              <dt>プラン</dt>
              <dd className={viewer.pro ? s.planPro : ""}>{planLabel(viewer.subscription)}</dd>
            </div>
          </dl>

          {!canPay ? (
            <p className={s.note}>いまは課金の設定がまだです（Vercel の環境変数）。</p>
          ) : viewer.pro ? (
            <form action="/api/stripe/portal" method="post">
              <button type="submit" className="btn btnInk">
                支払い方法・解約
              </button>
            </form>
          ) : (
            <div className={s.upsell}>
              <p className={s.upsellTitle}>
                有料プラン ・ 月 <span className="num">{PRICE_YEN}</span>円
              </p>
              <p className={s.upsellText}>12地点の比較、時合いと干潮の通知、30日先までの暦が使えます。</p>
              <form action="/api/stripe/checkout" method="post">
                <button type="submit" className="btn btnShu">
                  有料プランにする <span className="arrow">→</span>
                </button>
              </form>
              <Link href="/pricing" className={s.textLink}>
                できることをくわしく見る
              </Link>
            </div>
          )}

          <section className={s.notify} aria-labelledby="notify-title">
            <h2 id="notify-title" className={s.notifyTitle}>
              通知
            </h2>
            {n && NOTICE[n] ? <p className={n === "saved" ? s.note : s.error}>{NOTICE[n]}</p> : null}
            {viewer.pro ? (
              <form action={saveNotificationSettings} className={s.notifyForm}>
                <label className={s.check}>
                  <input type="checkbox" name="jiai" defaultChecked={settings.jiai} />
                  <span>
                    時合いの通知
                    <small>前の晩 21時と、時合いの開始の 90分前に知らせます。</small>
                  </span>
                </label>
                <label className={s.check}>
                  <input type="checkbox" name="lowTide" defaultChecked={settings.lowTide} />
                  <span>
                    干潮の通知
                    <small>翌朝の干潮がしきい値を下回るとき、前の晩 21時に知らせます。</small>
                  </span>
                </label>
                <label className={s.field}>
                  干潮のしきい値（cm）
                  <input
                    type="number"
                    name="threshold"
                    className="num"
                    inputMode="numeric"
                    min={THRESHOLD_MIN}
                    max={THRESHOLD_MAX}
                    step={1}
                    required
                    defaultValue={settings.thresholdCm}
                  />
                </label>
                <p className={s.fine}>
                  <span className="num">{THRESHOLD_MIN}</span>〜<span className="num">{THRESHOLD_MAX}</span>cm の整数。潮位は推算値です。送る時刻は日本時間。
                </p>
                <button type="submit" className="btn btnInk">
                  通知の設定を保存
                </button>
              </form>
            ) : (
              <p className={s.note}>
                時合いと干潮の通知は有料プランの機能です。
                <Link href="/pricing" className={s.textLinkInk}>
                  有料プランを見る
                </Link>
              </p>
            )}
          </section>

          <Link href="/mine" className={s.textLinkInk}>
            わたしの暦へ
          </Link>

          <form action="/auth/signout" method="post">
            <button type="submit" className={s.link}>
              ログアウト
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
