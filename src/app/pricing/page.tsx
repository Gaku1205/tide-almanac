import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_ROWS, PRICE_YEN } from "@/lib/plan";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Waves } from "@/components/Waves";
import s from "./pricing.module.css";

export const metadata: Metadata = { title: "料金" };

const FAQ = [
  {
    q: "いつでも解約できますか",
    a: "はい。アカウントの「支払い方法・解約」から、いつでも解約できます。解約しても、支払い済みの期間の終わりまでは有料の機能が使えます。",
  },
  {
    q: "無料のままでも使えますか",
    a: "使えます。地点を1つ登録すれば、今日と明日の潮汐曲線・満潮と干潮・日の出入り・時合いの予告が、期限なく無料で見られます。",
  },
  {
    q: "潮位はどれくらい正確ですか",
    a: "天文の計算で求めた推算値です。満潮・干潮の時刻はおおむね数分〜十数分の差に収まりますが、気圧や風、地形によって潮位が数十cm変わることがあります。海に出る前は、必ず現地の情報を確かめてください。",
  },
  {
    q: "支払い方法は",
    a: "クレジットカードです。毎月、申し込んだ日に自動で更新されます。",
  },
];

export default async function PricingPage() {
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader tone="paper" />
      <main className={s.page}>
        <div className={s.waveBand}>
          <Waves count={4} tone="paper" />
        </div>
        <div className="wrap">
          <header className={s.head}>
            <p className={s.eyebrow}>料金</p>
            <h1 className={s.title}>
              一地点は、ずっと無料。
              <br />
              比べて、知らせるなら
              <br />月 <span className="num">{PRICE_YEN}</span> 円。
            </h1>
          </header>

          <div className={s.plans}>
            <section className={s.plan} aria-labelledby="free">
              <h2 id="free" className={s.planName}>
                無料
              </h2>
              <p className={s.price}>
                <b className="num">0</b>円
              </p>
              <p className={s.planLead}>いつもの一地点の、今日と明日の暦。</p>
              <ul className={s.ticks}>
                <li>地点を1つ登録</li>
                <li>今日と明日の潮汐曲線・満潮と干潮</li>
                <li>日の出入り・月齢・潮名</li>
                <li>時合いの予告（強さつき）</li>
                <li>撮影の「青い時間」（今日だけ）</li>
              </ul>
              <Link href={viewer.user ? "/account" : "/login"} className={`btn btnInk ${s.cta}`}>
                {viewer.user ? "アカウントへ" : "無料で登録する"}
              </Link>
            </section>

            <section className={`${s.plan} ${s.pro}`} aria-labelledby="pro">
              <h2 id="pro" className={s.planName}>
                有料プラン <span className={s.tag}>おすすめ</span>
              </h2>
              <p className={s.price}>
                <b className="num">{PRICE_YEN}</b>円<span className={s.per}> / 月（税込）</span>
              </p>
              <p className={s.planLead}>行き先を選び、時刻を逃さない。無料のすべてに加えて：</p>
              <ul className={s.ticks}>
                <li>
                  <b>地点の比較</b> — 12地点まで保存し、同じ日の時合いを強い順に並べる
                </li>
                <li>
                  <b>時合いの通知</b> — 前の晩21時と、時合いの90分前
                </li>
                <li>
                  <b>干潮の通知</b> — 潮位が決めた高さを下回る朝
                </li>
                <li>
                  <b>30日先まで</b>の暦と、撮影の「青い時間」×潮の高さ
                </li>
              </ul>
              {viewer.pro ? (
                <Link href="/account" className={`btn btnShu ${s.cta}`}>
                  いまのプランを見る
                </Link>
              ) : (
                <form action="/api/stripe/checkout" method="post" className={s.ctaForm}>
                  <button type="submit" className={`btn btnShu ${s.cta}`}>
                    有料プランにする <span className="arrow">→</span>
                  </button>
                  {!viewer.user ? <p className={s.note}>はじめにログイン（無料の登録）をしてから、支払いの画面へ進みます。</p> : null}
                </form>
              )}
            </section>
          </div>

          <section className={s.tableWrap} aria-labelledby="compare">
            <h2 id="compare" className={s.h2}>
              できることの比較
            </h2>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr">機能</span>
                  </th>
                  <th scope="col">無料</th>
                  <th scope="col" className={s.proCol}>
                    有料
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td className={r.free === "—" ? s.none : ""}>{r.free}</td>
                    <td className={s.proCol}>{r.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={s.faq} aria-labelledby="faq">
            <h2 id="faq" className={s.h2}>
              よくある質問
            </h2>
            <dl>
              {FAQ.map((f) => (
                <div key={f.q} className={s.qa}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
