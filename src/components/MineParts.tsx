// 「わたしの暦」の部品（登録欄・登録済みの一覧・無料の1地点の暦・有料の比較の表）
import Link from "next/link";
import { dayAlmanac, hm, jpDay, type DayAlmanac } from "@/lib/almanac";
import { SPOTS } from "@/lib/spots";
import { addSpot, removeSpot } from "@/app/mine/actions";
import { TideChart } from "./TideChart";
import s from "./mine.module.css";

export function bestOf(a: DayAlmanac) {
  return a.windows.reduce((m, w) => (w.score > m.score ? w : m), a.windows[0]);
}

const MESSAGES: Record<string, string> = {
  duplicate: "その地点はもう登録してあります。",
  unknown: "その地点は選べません。一覧から選んでください。",
  fail: "保存できませんでした。少し待ってから、もう一度お試しください。",
};

/** 登録欄：地点を選んで追加する。上限はサーバーで判定する（ここでは出し分けだけ） */
export function AddSpotForm({ saved, pro, limit, error }: { saved: string[]; pro: boolean; limit: number; error?: string }) {
  const choices = SPOTS.filter((sp) => !saved.includes(sp.id));
  const full = saved.length >= limit;
  return (
    <div>
      <p className={`num ${s.count}`}>
        登録 {saved.length} / {limit} 地点
      </p>
      {full || choices.length === 0 ? null : (
        <form action={addSpot} className={s.addForm}>
          <label className="sr" htmlFor="spot">
            追加する地点
          </label>
          <select id="spot" name="spot" className={s.select} defaultValue={choices[0].id}>
            {choices.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}（{sp.area}）
              </option>
            ))}
          </select>
          <button type="submit" className="btn btnShu">
            地点を追加 <span className="arrow">→</span>
          </button>
        </form>
      )}
      {error === "limit" || (full && !pro) ? (
        <p className={s.message} role="status">
          無料プランで登録できるのは {limit} 地点までです。地点を入れ替えるときは、いまの地点を削除してから追加してください。12地点まで登録して比べるには、
          <Link href="/pricing">有料プラン</Link>が必要です。
        </p>
      ) : null}
      {error === "limit" && pro ? (
        <p className={s.message} role="status">
          登録できるのは {limit} 地点までです。
        </p>
      ) : null}
      {error && MESSAGES[error] ? (
        <p className={s.message} role="status">
          {MESSAGES[error]}
        </p>
      ) : null}
    </div>
  );
}

/** 登録済みの地点の一覧。削除はいつでもできる */
export function SavedList({ ids }: { ids: string[] }) {
  const items = ids.flatMap((id) => SPOTS.filter((sp) => sp.id === id));
  if (items.length === 0) return <p className={s.empty}>まだ地点がありません。左の欄から、いつもの海を選んでください。</p>;
  return (
    <ul className={s.spots}>
      {items.map((sp, i) => (
        <li key={sp.id}>
          <span className={`num ${s.index}`}>{String(i + 1).padStart(2, "0")}</span>
          <span>
            <b>{sp.name}</b>
            <small>{sp.area}</small>
          </span>
          <form action={removeSpot}>
            <input type="hidden" name="spot" value={sp.id} />
            <button type="submit" className={s.remove} aria-label={`${sp.name}を削除`}>
              削除
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

/** 無料の1地点：ある日の潮汐曲線・満潮と干潮・日の出入り・時合い */
export function DayBlock({ a, now }: { a: DayAlmanac; now: number }) {
  const best = bestOf(a);
  const highs = a.extremes.filter((e) => e.kind === "high");
  const lows = a.extremes.filter((e) => e.kind === "low");
  return (
    <section aria-label={`${jpDay(a.dayStart)}の${a.spot.name}`}>
      <div className={s.dayHead}>
        <h3 className={s.dayTitle}>
          <span className="num">{jpDay(a.dayStart)}</span> ・ {a.spot.name}
        </h3>
      </div>
      <dl className={s.facts}>
        <div>
          <dt>潮名</dt>
          <dd>{a.name}</dd>
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
      <TideChart a={a} now={now} ratio={0.28} />
      <ul className={s.windows}>
        {a.windows.map((w) => (
          <li key={w.start} className={w === best ? s.best : ""}>
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
    </section>
  );
}

/** 有料の比較の表：登録した地点の、ある日の時合いを強い順に（トップの比較の節と同じ作り） */
export function CompareBoard({ spotIds, dayStart }: { spotIds: string[]; dayStart: number }) {
  const rows = SPOTS.filter((sp) => spotIds.includes(sp.id))
    .map((sp) => dayAlmanac(sp, dayStart))
    .map((d) => ({ d, best: bestOf(d) }))
    .sort((x, y) => y.best.score - x.best.score);
  if (rows.length === 0) return null;
  const domain = { lo: Math.min(...rows.map((r) => r.d.range.lo)), hi: Math.max(...rows.map((r) => r.d.range.hi)) };
  return (
    <div className={s.board} role="table" aria-label={`${jpDay(dayStart)}の地点の比較`}>
      <div className={s.boardHead} role="row">
        <span role="columnheader">
          地点 ・ <span className="num">{jpDay(dayStart)}</span>
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
      {rows.map(({ d, best }, i) => (
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
              {hm(best.start)}–{hm(best.end)}
            </span>
            <small>{best.reason}</small>
            <b className={`num ${s.boardScore}`}>{best.score}</b>
          </span>
        </div>
      ))}
    </div>
  );
}
