import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { billingEnabled } from "@/lib/env";
import { planLabel } from "@/lib/billing";
import { PRICE_YEN } from "@/lib/plan";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import s from "@/components/member.module.css";

export const metadata: Metadata = { title: "アカウント" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/account");
  const { ok } = await searchParams;
  const canPay = billingEnabled();
  return (
    <>
      <SiteHeader tone="paper" />
      <main className={s.page}>
        <div className={s.pageInner}>
          <p className={s.eyebrow}>アカウント</p>
          <h1 className={s.title}>あなたの暦</h1>
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
