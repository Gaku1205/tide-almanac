import Image from "next/image";
import Link from "next/link";
import { requestTime } from "@/lib/clock";
import { HOUR, dayAlmanac, hm, jpDay, startOfJstDay, tideLevel, tideStage, type DayAlmanac } from "@/lib/almanac";
import { PRICE_YEN } from "@/lib/plan";
import { SPOTS, searchSpots, spotById } from "@/lib/spots";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TideChart } from "@/components/TideChart";
import { Waves } from "@/components/Waves";
import s from "./home.module.css";

function bestOf(a: DayAlmanac) {
  return a.windows.reduce((m, w) => (w.score > m.score ? w : m), a.windows[0]);
}

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = (first(params.q) ?? "").trim();
  const found = searchSpots(q);
  const now = await requestTime();
  const today = startOfJstDay(now);
  const tomorrow = today + 24 * HOUR;
  const home = spotById(first(params.spot));
  const a = dayAlmanac(home, today);
  const stage = tideStage(home, now);
  const level = Math.round(tideLevel(home, now));
  const next = a.windows.find((w) => w.end > now) ?? dayAlmanac(home, tomorrow).windows[0];
  const nextIsTomorrow = next.start >= tomorrow;
  const best = bestOf(a);
  const highs = a.extremes.filter((e) => e.kind === "high");
  const lows = a.extremes.filter((e) => e.kind === "low");

  const compare = ["jogashima", "sunosaki", "irago", "oura"]
    .map((id) => dayAlmanac(spotById(id), tomorrow))
    .map((d) => ({ d, best: bestOf(d) }))
    .sort((x, y) => y.best.score - x.best.score);
  const domain = { lo: Math.min(...compare.map((c) => c.d.range.lo)), hi: Math.max(...compare.map((c) => c.d.range.hi)) };

  const photo = ["oura", "jogashima", "irago"].map((id) => dayAlmanac(spotById(id), tomorrow));

  return (
    <>
      <SiteHeader />
      <main>
        {/* ---- 夜の章：見出しと、今日の暦 ---- */}
        <section className={s.hero}>
          <Waves />
          <div className={`wrap ${s.heroGrid}`}>
            <div className={s.heroText}>
              <p className={`${s.eyebrow} num`}>
                <span className={s.dot} /> {jpDay(today)} ・ {home.name}（{home.area}）
              </p>
              <h1 className={s.h1}>
                潮と光が
                <br />
                重なる刻を、
                <br />
                <span className={s.h1Shu}>前の晩に。</span>
              </h1>
              <p className={s.lead}>
                tide-almanac は、地点ごとの潮の満ち引きと、日の出入り・月齢を読み合わせて、魚が口を使い、空が色づく「時合い」を予告する潮汐暦です。釣り人と、海辺で撮る人のために。
              </p>
              <div className={s.ctas}>
                <Link href="/login" className="btn btnShu">
                  無料で地点を登録する <span className="arrow">→</span>
                </Link>
                <Link href="/pricing" className="btn btnGhost">
                  料金を見る
                </Link>
              </div>
            </div>

            <div className={s.heroPhoto}>
              <Image src="/photos/03-fisherman-sunrise-sea.jpg" alt="朝日が昇る浅い海へ、小舟を漕ぎ出す人" fill priority sizes="(max-width: 1024px) 100vw, 42vw" className={s.cover} />
              <div className={s.heroShade} />
              <div className={s.nowCard}>
                <div className={s.nowRow}>
                  <span className={s.nowLabel}>いまの潮</span>
                  <span className={s.nowStage}>{stage.label}</span>
                  <span className={`num ${s.nowLevel}`}>
                    {level}
                    <small>cm</small> {stage.rising ? "↑" : "↓"}
                  </span>
                </div>
                <div className={s.nextRow}>
                  <span className={s.nowLabel}>{nextIsTomorrow ? "明日の時合い" : "次の時合い"}</span>
                  <span className={`num ${s.nextTime}`}>
                    {hm(next.start)}–{hm(next.end)}
                  </span>
                  <span className={s.nextWhy}>{next.reason}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 今日の暦 */}
          <div className={`wrap ${s.today}`}>
            <section className={s.finder} aria-labelledby="finder-title">
              <h2 id="finder-title" className={s.finderTitle}>
                地点を探す
              </h2>
              <form method="get" action="/" role="search" className={s.finderForm}>
                <input type="hidden" name="spot" value={home.id} />
                <label htmlFor="spot-q" className={s.finderLabel}>
                  地点名・地域
                </label>
                <input id="spot-q" name="q" type="search" defaultValue={q} placeholder="例：江の島、神奈川" className={s.finderInput} autoComplete="off" />
                <button type="submit" className="btn btnGhost">
                  探す
                </button>
              </form>
              <p className={s.finderCount} role="status">
                {q === "" ? `見本の${SPOTS.length}地点` : found.length > 0 ? `「${q}」に合う地点 ${found.length}件` : ""}
              </p>
              {found.length > 0 ? (
                <ul className={s.finderList}>
                  {found.map((sp) => {
                    const href = q === "" ? `/?spot=${sp.id}` : `/?spot=${sp.id}&q=${encodeURIComponent(q)}`;
                    return (
                      <li key={sp.id}>
                        <Link href={href} className={s.finderItem} aria-current={sp.id === home.id ? "true" : undefined}>
                          <b>{sp.name}</b>
                          <small>{sp.area}</small>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={s.finderEmpty}>「{q}」に合う地点は見つかりませんでした。地点名か地域（例：神奈川）を短く入れてみてください。</p>
              )}
            </section>
            <div className={s.todayHead}>
              <h2 className={s.todayTitle}>
                今日の暦 <span className="num">{jpDay(today)}</span>
              </h2>
              <dl className={s.facts}>
                <div>
                  <dt>潮名</dt>
                  <dd>{a.name}</dd>
                </div>
                <div>
                  <dt>月齢</dt>
                  <dd className="num">{a.age.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>満潮</dt>
                  <dd className="num">{highs.map((e) => hm(e.t)).join(" / ")}</dd>
                </div>
                <div>
                  <dt>干潮</dt>
                  <dd className="num">{lows.map((e) => hm(e.t)).join(" / ")}</dd>
                </div>
                <div>
                  <dt>日の出・入り</dt>
                  <dd className="num">
                    {hm(a.sun.rise)} / {hm(a.sun.set)}
                  </dd>
                </div>
              </dl>
            </div>
            <TideChart a={a} now={now} ratio={0.28} />
            <ul className={s.windows}>
              {a.windows.map((w) => (
                <li key={w.start} className={w === best ? s.windowBest : ""}>
                  <span className={`num ${s.wTime}`}>
                    {hm(w.start)}–{hm(w.end)}
                  </span>
                  <span className={s.wWhy}>{w.reason}</span>
                  <span className={s.wScore}>
                    強さ <b className="num">{w.score}</b>
                  </span>
                </li>
              ))}
            </ul>
            <p className={s.estimate}>※ 推算値。潮位は気象庁の調和定数から推算。気圧や風による差は含みません。</p>
          </div>
        </section>

        {/* ---- 紙の章：暦の読み方 ---- */}
        <section id="read" className={s.paper}>
          <div className={`wrap ${s.readGrid}`}>
            <div className={s.readHead}>
              <p className={s.eyebrowInk}>暦の読み方</p>
              <h2 className={s.h2}>
                三つの周期を、
                <br />
                一枚に刷る。
              </h2>
              <p className={s.body}>
                魚がよく食う時間は、潮が動き出す時と、空が明るむ・暗くなる時に集まります。どちらか一つでは足りません。月が決める潮の大きさ、地点ごとの満ち引きの時刻、季節で動く日の出入り。三つを重ねて、強い所だけを朱で刷ります。
              </p>
            </div>
            <figure className={s.print}>
              <div className={s.printImg}>
                <Image src="/photos/02-fisherman-sunrise-sea.webp" alt="朝日の昇る海で、小舟から網を打つ人を描いた江戸の摺物" fill sizes="(max-width: 900px) 100vw, 40vw" className={s.cover} />
              </div>
              <figcaption>江戸の摺物「佃の沖」より（パブリックドメイン）</figcaption>
            </figure>
          </div>

          <div className="wrap">
          <div className={s.cycles}>
            <article className={s.cycle}>
              <span className={s.kanji}>壱</span>
              <h3>潮 — 満ち引き</h3>
              <p>月と太陽が引く、一日二度の満ち引き。地点ごとに時刻も幅も違います。動き出しの「上げ三分」「下げ七分」が狙い目。</p>
              <p className={`num ${s.cycleVal}`}>
                満潮 {highs.map((e) => `${hm(e.t)}（${Math.round(e.h)}cm）`).join("・")}
              </p>
            </article>
            <article className={s.cycle}>
              <span className={s.kanji}>弐</span>
              <h3>日 — まずめ</h3>
              <p>日の出と日の入りの前後、薄明かりの一時間。小魚が浮き、それを追う魚が寄る。撮る人には、空がいちばん青く色づく時間です。</p>
              <p className={`num ${s.cycleVal}`}>
                日の出 {hm(a.sun.rise)}・日の入り {hm(a.sun.set)}
              </p>
            </article>
            <article className={s.cycle}>
              <span className={s.kanji}>参</span>
              <h3>月 — 潮の大きさ</h3>
              <p>新月と満月のころは大潮で、潮がよく動く。半月のころは小潮。月齢から、その日の潮の勢いを決めます。</p>
              <p className={`num ${s.cycleVal}`}>
                月齢 {a.age.toFixed(1)}・{a.name}
              </p>
            </article>
          </div>
          </div>

          <div className="wrap">
            <div className={s.result}>
              <span className={s.resultEq} aria-hidden="true">
                ＝
              </span>
              <div>
                <p className={s.resultLabel}>今日の{home.name}の、いちばん強い時合い</p>
                <p className={s.resultMain}>
                  <span className="num">
                    {hm(best.start)}–{hm(best.end)}
                  </span>
                  <span className={s.resultWhy}>{best.reason}</span>
                </p>
              </div>
              <p className={s.resultScore}>
                <span>強さ</span>
                <b className="num">{best.score}</b>
              </p>
            </div>
          </div>
        </section>

        {/* ---- 無料と有料 ---- */}
        <section className={s.plans}>
          <div className={`wrap ${s.plansGrid}`}>
            <div>
              <p className={s.eyebrowInk}>無料でできること</p>
              <h2 className={s.h3}>まず、いつもの一地点。</h2>
              <ul className={s.ticks}>
                <li>地点を1つ登録して、今日と明日の潮汐曲線</li>
                <li>満潮・干潮、日の出入り、月齢と潮名</li>
                <li>その日の時合いの予告（強さつき）</li>
              </ul>
            </div>
            <div className={s.planPro}>
              <p className={s.eyebrowShu}>有料プラン ・ 月 {PRICE_YEN}円</p>
              <h2 className={s.h3}>行き先を選び、時刻を逃さない。</h2>
              <ul className={s.ticks}>
                <li>
                  <b>地点の比較</b>：12地点まで保存し、同じ日の時合いを横に並べる
                </li>
                <li>
                  <b>時合いの通知</b>：前の晩と、時合いの90分前に知らせる
                </li>
                <li>
                  <b>30日先まで</b>の暦と、撮影の「青い時間」×潮の高さ
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---- 夜の章：有料の機能 ---- */}
        <section className={s.pro}>
          <div className="wrap">
            <div className={s.proHead}>
              <div>
                <p className={s.eyebrow}>
                  <span className={s.badge}>有料</span> 地点の比較
                </p>
                <h2 className={s.h2Night}>
                  どの磯へ行くか、
                  <br />
                  前の晩に決まる。
                </h2>
              </div>
              <p className={s.bodyNight}>
                保存した地点の、明日の潮と時合いを同じ時刻の物差しで並べます。強い順に並び替わるので、上から順に行き先の候補です。
              </p>
            </div>

            <div className={s.board} role="table" aria-label={`${jpDay(tomorrow)}の地点の比較`}>
              <div className={s.boardHead} role="row">
                <span role="columnheader">
                  地点 ・ <span className="num">{jpDay(tomorrow)}</span>
                </span>
                <span role="columnheader" className={s.boardHours}>
                  {[0, 6, 12, 18, 24].map((h) => (
                    <span key={h} className="num" style={{ left: `${(h / 24) * 100}%` }}>
                      {h}
                    </span>
                  ))}
                </span>
                <span role="columnheader">いちばん強い時合い</span>
              </div>
              {compare.map(({ d, best: b }, i) => (
                <div key={d.spot.id} className={`${s.boardRow} ${i === 0 ? s.boardTop : ""}`} role="row">
                  <span role="cell" className={s.boardSpot}>
                    <span className={`num ${s.rank}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <b>{d.spot.name}</b>
                      <small>
                        {d.spot.area} ・ {d.name}
                      </small>
                    </span>
                  </span>
                  <span role="cell" className={s.boardChart}>
                    <TideChart a={d} labels={false} axis={false} ratio={0.18} domain={domain} />
                  </span>
                  <span role="cell" className={s.boardBest}>
                    <span className="num">
                      {hm(b.start)}–{hm(b.end)}
                    </span>
                    <small>{b.reason}</small>
                    <b className={`num ${s.boardScore}`}>{b.score}</b>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`wrap ${s.notify}`}>
            <div>
              <p className={s.eyebrow}>
                <span className={s.badge}>有料</span> 時合いの通知
              </p>
              <h2 className={s.h2Night}>
                時合いの前に、
                <br />
                知らせが届く。
              </h2>
              <ul className={s.notifyList}>
                <li>
                  <span className="num">21:00</span> 前の晩に、明日の行き先の候補と時合い
                </li>
                <li>
                  <span className="num">−90分</span> 時合いが始まる90分前に、もう一度
                </li>
                <li>
                  <span className="num">干潮</span> 潮位が決めた高さを下回る朝（磯遊び・干潟の撮影に）
                </li>
              </ul>
            </div>
            <div className={s.phone} aria-label="通知の見本">
              <div className={s.phoneTop}>
                <span className="num">21:00</span>
                <span className={s.phoneIsland} />
              </div>
              <p className={`num ${s.phoneDate}`}>{jpDay(tomorrow)}</p>
              <div className={s.toast}>
                <span className={s.toastIcon} aria-hidden="true" />
                <div>
                  <p className={s.toastApp}>tide-almanac ・ 明日の暦</p>
                  <p className={s.toastText}>
                    第一候補は{compare[0].d.spot.name}。<span className="num">{hm(compare[0].best.start)}–{hm(compare[0].best.end)}</span>、{compare[0].best.reason}（強さ {compare[0].best.score}）。
                  </p>
                </div>
              </div>
              <div className={s.toast}>
                <span className={s.toastIcon} aria-hidden="true" />
                <div>
                  <p className={s.toastApp}>tide-almanac ・ 90分前</p>
                  <p className={s.toastText}>
                    {compare[1].d.spot.name}の時合いまで、あと90分。<span className="num">{hm(compare[1].best.start)}</span> から。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- 紙の章：撮る人へ ---- */}
        <section className={s.photo}>
          <div className={`wrap ${s.photoGrid}`}>
            <div className={s.photoImg}>
              <Image src="/photos/07-seashore-twilight.jpg" alt="夜明け前、潮が引いて濡れた浜が舟の明かりを映している" fill sizes="(max-width: 900px) 100vw, 45vw" className={s.cover} />
            </div>
            <div className={s.photoText}>
              <p className={s.eyebrowInk}>
                <span className={s.badgeInk}>有料</span> 撮る人へ
              </p>
              <h2 className={s.h2}>
                干潟が空を映す朝を、
                <br />
                狙って撮る。
              </h2>
              <p className={s.body}>
                空が青く色づく薄明の時間と、潮が引いている時間が重なる朝は、濡れた砂や潮だまりが鏡になります。地点ごとに、その重なりを30日先まで探せます。
              </p>
              <ul className={s.moments}>
                {photo.map((d) => {
                  const m = d.photo[0];
                  return (
                    <li key={d.spot.id}>
                      <span className={s.mSpot}>
                        {d.spot.name}
                        <small>{d.spot.area}</small>
                      </span>
                      <span className={`num ${s.mTime}`}>
                        {hm(m.start)}–{hm(m.end)}
                      </span>
                      <span className={s.mTide}>
                        <span className={s.meter}>
                          <i style={{ width: `${m.tidePercent}%` }} />
                        </span>
                        <span className="num">潮 {m.tidePercent}%</span>
                      </span>
                      <span className={m.mirror ? s.mirror : s.noMirror}>{m.mirror ? "鏡面になりやすい" : "潮が高め"}</span>
                    </li>
                  );
                })}
              </ul>
              <p className={s.small}>明日 {jpDay(tomorrow)} の「朝の青」（市民薄明から日の出の20分後まで）。</p>
            </div>
          </div>
        </section>

        {/* ---- 料金への誘い ---- */}
        <section className={s.closing}>
          <Waves count={5} />
          <div className={`wrap ${s.closingInner}`}>
            <p className={s.closingPrice}>
              <span>月</span>
              <b className="num">{PRICE_YEN}</b>
              <span>円</span>
            </p>
            <h2 className={s.closingTitle}>海へ出る日を、外さない。</h2>
            <p className={s.bodyNight}>一回の釣行のガソリン代より安く、一か月ぶんの朝を読み解きます。いつでも解約できます。</p>
            <div className={s.ctas}>
              <Link href="/pricing" className="btn btnShu">
                料金とできることを見る <span className="arrow">→</span>
              </Link>
              <Link href="/login" className="btn btnGhost">
                まず無料で使う
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
