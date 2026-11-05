import Link from "next/link";
import { requestTime } from "@/lib/clock";
import { DAY_MS, dayAlmanac, hm, jpDay, startOfJstDay, tideLevel, tideStage, type DayAlmanac } from "@/lib/almanac";
import { bestWindow, compareRows, dayChips, homeHref, parseDayOffset, previewDays, sharedDomain } from "@/lib/home";
import { strengthKey, strengthOf } from "@/lib/strength";
import { SPOTS, searchSpots, spotById } from "@/lib/spots";
import { getViewer } from "@/lib/viewer";
import { CompareTable } from "@/components/CompareTable";
import { HomeBar } from "@/components/HomeBar";
import { Lock } from "@/components/Lock";
import { SiteFooter } from "@/components/SiteFooter";
import { TideChart } from "@/components/TideChart";
import s from "./home.module.css";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  const q = (first(params.q) ?? "").trim();
  const found = searchSpots(q);
  const now = await requestTime();
  const today = startOfJstDay(now);
  const home = spotById(first(params.spot));
  const day = parseDayOffset(first(params.d), viewer.pro);
  const dayStart = today + day * DAY_MS;
  const a = dayAlmanac(home, dayStart);
  const highs = a.extremes.filter((e) => e.kind === "high");
  const lows = a.extremes.filter((e) => e.kind === "low");
  const isToday = day === 0;
  const stage = isToday ? tideStage(home, now) : null;
  const level = isToday ? Math.round(tideLevel(home, now)) : 0;

  // 明日以降：鍵つきの日は暦を作らない（無料の人に中身を送らない）
  const previews = previewDays(today, viewer.pro).map((p) => ({ ...p, a: p.locked ? null : dayAlmanac(home, p.dayStart) }));
  const previewDomain = sharedDomain(previews.flatMap((p) => (p.a ? [p.a] : [])));

  // 地点の比較：無料は1位だけ（残りは数だけ）
  const compare = compareRows(SPOTS, dayStart, viewer.pro);

  const chips = dayChips(today, viewer.pro, { spot: home.id, q });
  const dayName = isToday ? "今日" : day === 1 ? "明日" : null;

  return (
    <>
      <HomeBar spot={home} q={q} found={found} day={day} chips={chips} loggedIn={viewer.user !== null} />
      <main className={s.main}>
        {/* 選んだ日の暦（最初の画面） */}
        <section className={`wrap ${s.today}`} aria-labelledby="today-title">
          <div className={s.head}>
            <h1 id="today-title" className={s.title}>
              <span>{home.name}</span>
              <span className="num">{jpDay(dayStart)}</span>
              <span>{a.name}</span>
            </h1>
            <p className={s.area}>
              {dayName ? `${dayName}の暦 ・ ` : ""}
              {home.area}
            </p>
          </div>
          <dl className={s.facts}>
            {stage ? (
              <div>
                <dt>いまの潮</dt>
                <dd>
                  {stage.label} <span className="num">{level}cm</span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>満潮</dt>
              <dd className="num">{highs.map((e) => hm(e.t)).join(" / ") || "—"}</dd>
            </div>
            <div>
              <dt>干潮</dt>
              <dd className="num">{lows.map((e) => hm(e.t)).join(" / ") || "—"}</dd>
            </div>
            <div>
              <dt>日の出</dt>
              <dd className="num">{hm(a.sun.rise)}</dd>
            </div>
            <div>
              <dt>日の入り</dt>
              <dd className="num">{hm(a.sun.set)}</dd>
            </div>
            <div>
              <dt>月齢</dt>
              <dd className="num">{a.age.toFixed(1)}</dd>
            </div>
          </dl>

          <div className={s.chart}>
            <TideChart a={a} now={isToday ? now : undefined} ratio={0.24} ratioSm={0.5} />
          </div>

          <ul className={s.windows} aria-label="時合い">
            {a.windows.map((w) => (
              <li key={w.start} className={s[strengthKey(w.score)]}>
                <span className={s.wLabel}>時合い</span>
                <span className={`num ${s.wTime}`}>
                  {hm(w.start)}–{hm(w.end)}
                </span>
                <span className={s.wWhy}>{w.reason}</span>
                <b className={s.wWord} aria-label={`強さ ${strengthOf(w.score)}`}>
                  {strengthOf(w.score)}
                </b>
              </li>
            ))}
            {a.windows.length === 0 ? <li className={s.wNone}>この日は時合いがありません</li> : null}
          </ul>

          <details id="read" className={s.read}>
            <summary>暦の読み方</summary>
            <div className={s.readBody}>
              <p>
                時合いは、潮がよく動く時間と、日の出・日の入りの前後（まずめ）が重なる所です。潮の大きさは月齢で決まり（大潮ほどよく動く）、満ち引きの時刻は地点ごとに違います。この三つを重ねて、強い順に「強」「並」「弱」と出します。
              </p>
              <p>
                曲線の暗い帯は夜、薄い帯は薄明（空が明るむ・暗くなる時間）、朱の帯が時合いです。朱が濃いほど強い時合いです。満潮・干潮の時刻と潮位は曲線の上に書いてあります。
              </p>
            </div>
          </details>
          <p className={s.estimate}>※ 推算値（潮位は気象庁の調和定数から推算）。気圧や風による差は含みません。</p>
        </section>

        {/* 明日以降 */}
        <section className={`wrap ${s.section}`} aria-labelledby="ahead-title">
          <h2 id="ahead-title" className={s.h2}>
            明日以降
          </h2>
          <ol className={s.ahead}>
            {previews.map((p) =>
              p.a ? (
                <li key={p.offset}>
                  <Link
                    href={homeHref({ spot: home.id, q, d: p.offset })}
                    className={`${s.card} ${p.offset === day ? s.cardOn : ""}`}
                    aria-current={p.offset === day ? "date" : undefined}
                  >
                    <span className={s.cardHead}>
                      <span>
                        {p.offset === 1 ? "明日 " : ""}
                        <span className="num">{jpDay(p.dayStart)}</span>
                      </span>
                      <small>{p.a.name}</small>
                    </span>
                    <TideChart a={p.a} labels={false} axis={false} ratio={0.45} domain={previewDomain} />
                    <CardBest a={p.a} />
                  </Link>
                </li>
              ) : (
                <li key={p.offset}>
                  <Link href="/pricing" className={`${s.card} ${s.cardLocked}`} aria-label={`${jpDay(p.dayStart)}は有料プランで見られます`}>
                    <span className={s.cardHead}>
                      <span className="num">{jpDay(p.dayStart)}</span>
                    </span>
                    <span className={s.lockBox}>
                      <Lock size={20} />
                      有料
                    </span>
                  </Link>
                </li>
              ),
            )}
          </ol>
        </section>

        {/* 地点の比較 */}
        <section className={`wrap ${s.section}`} aria-labelledby="compare-title">
          <h2 id="compare-title" className={s.h2}>
            地点の比較
          </h2>
          <CompareTable rows={compare.rows} locked={compare.locked} dayStart={dayStart} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function CardBest({ a }: { a: DayAlmanac }) {
  const best = bestWindow(a.windows);
  if (!best) return <span className={s.cardBest}>時合いなし</span>;
  return (
    <span className={s.cardBest}>
      <span className="num">
        {hm(best.start)}–{hm(best.end)}
      </span>
      <b>{strengthOf(best.score)}</b>
    </span>
  );
}
