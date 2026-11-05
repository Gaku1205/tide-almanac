// 比較の表（トップの「地点の比較」と /mine で同じ物。docs/design.md「比較の表」）
// 行の中身はサーバーで作った物だけを受け取る。鍵つきの行は数だけ（地点名も曲線も渡さない）
import Link from "next/link";
import { hm, jpDay } from "@/lib/almanac";
import { sharedDomain, type CompareRow } from "@/lib/home";
import { strengthOf } from "@/lib/strength";
import { Lock } from "./Lock";
import { TideChart } from "./TideChart";
import s from "./CompareTable.module.css";

export function CompareTable({ rows, locked = 0, dayStart }: { rows: CompareRow[]; locked?: number; dayStart: number }) {
  if (rows.length === 0) return null;
  const domain = sharedDomain(rows.map((r) => r.d));
  return (
    <>
      <div className={s.board} role="table" aria-label={`${jpDay(dayStart)}の地点の比較`}>
      <div className={s.head} role="row">
        <span role="columnheader">
          地点 ・ <span className="num">{jpDay(dayStart)}</span>
        </span>
        <span role="columnheader" className={s.hours}>
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h} className="num" style={{ left: `${(h / 24) * 100}%` }}>
              {h}
            </span>
          ))}
        </span>
        <span role="columnheader">いちばん強い時合い</span>
      </div>
      {rows.map(({ d, best }, i) => (
        <div key={d.spot.id} className={`${s.row} ${i === 0 ? s.top : ""}`} role="row">
          <span role="cell" className={s.spot}>
            <span className={`num ${s.rank}`}>{String(i + 1).padStart(2, "0")}</span>
            <span>
              <b>{d.spot.name}</b>
              <small>
                {d.spot.area} ・ {d.name}
              </small>
            </span>
          </span>
          <span role="cell" className={s.chart}>
            <TideChart a={d} labels={false} axis={false} ratio={0.18} domain={domain} />
          </span>
          <span role="cell" className={s.best}>
            {best ? (
              <>
                <span className="num">
                  {hm(best.start)}–{hm(best.end)}
                </span>
                <small>{best.reason}</small>
                <b className={s.word}>{strengthOf(best.score)}</b>
              </>
            ) : (
              <span className="num">—</span>
            )}
          </span>
        </div>
      ))}
      {Array.from({ length: locked }, (_, i) => (
        <Link key={i} href="/pricing" className={`${s.row} ${s.locked}`} role="row" aria-label={`${rows.length + i + 1}位は有料プランで見られます`}>
          <span role="cell" className={s.spot}>
            <span className={`num ${s.rank}`}>{String(rows.length + i + 1).padStart(2, "0")}</span>
            <span className={s.lockText}>
              <Lock size={14} /> 有料
            </span>
          </span>
        </Link>
      ))}
      </div>
      {locked > 0 ? (
        <p className={s.more}>
          <Link href="/pricing">残り{locked}地点は有料プランで比べられます</Link>
        </p>
      ) : null}
    </>
  );
}
