import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_ROWS, PRICE_YEN } from "@/lib/plan";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import s from "./pricing.module.css";

export const metadata: Metadata = { title: "料金" };

export default async function PricingPage() {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader tone="paper" />
      <main className={s.page}>
        <div className="wrap">
          <h1 className={s.title}>料金</h1>
          <div className={s.scroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr">項目</span>
                  </th>
                  <th scope="col">無料</th>
                  <th scope="col" className={s.proCol}>
                    有料
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className={s.priceRow}>
                  <th scope="row">月額</th>
                  <td>
                    <b className="num">0</b>円
                  </td>
                  <td className={s.proCol}>
                    <b className="num">{PRICE_YEN}</b>円<span className={s.per}> / 月（税込）</span>
                  </td>
                </tr>
                {PLAN_ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td className={r.free === "—" ? s.none : ""}>{r.free}</td>
                    <td className={s.proCol}>{r.pro}</td>
                  </tr>
                ))}
                <tr className={s.ctaRow}>
                  <th scope="row">
                    <span className="sr">申し込み</span>
                  </th>
                  <td>
                    <Link href={viewer.user ? "/account" : "/login"} className={`btn btnInk ${s.cta}`}>
                      {viewer.user ? "アカウントへ" : "無料で登録"}
                    </Link>
                  </td>
                  <td className={s.proCol}>
                    {viewer.pro ? (
                      <Link href="/account" className={`btn btnShu ${s.cta}`}>
                        いまのプランを見る
                      </Link>
                    ) : (
                      <form action="/api/stripe/checkout" method="post">
                        <button type="submit" className={`btn btnShu ${s.cta}`}>
                          有料プランにする <span className="arrow">→</span>
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {!viewer.user && !viewer.pro ? <p className={s.note}>有料プランは、ログイン（無料の登録）のあとに支払いの画面へ進みます。いつでも解約できます。</p> : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
