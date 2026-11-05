// 「わたしの暦」の先読みの部品（30日先の暦・地点の選び・撮影の「青い時間」×潮の高さ）
import Link from "next/link";
import { hm, jpDay, type PhotoMoment } from "@/lib/almanac";
import { calendarRows, photoMornings, photoToday } from "@/lib/forecast";
import { SPOTS } from "@/lib/spots";
import s from "./mine.module.css";

/** 30日先の暦（有料）で、どの地点を見るかを選ぶリンク */
export function SpotTabs({ ids, current }: { ids: string[]; current: string }) {
  const items = ids.flatMap((id) => SPOTS.filter((sp) => sp.id === id));
  if (items.length < 2) return null;
  return (
    <nav className={s.tabs} aria-label="暦を見る地点">
      {items.map((sp) => (
        <Link key={sp.id} href={`/mine?spot=${sp.id}`} scroll={false} aria-current={sp.id === current ? "true" : undefined} className={sp.id === current ? s.tabOn : ""}>
          {sp.name}
        </Link>
      ))}
    </nav>
  );
}

/** 有料：選んだ地点の30日先までの暦（日ごとの潮名・いちばん強い時合い・強さ） */
export function MonthCalendar({ spotId, today }: { spotId: string; today: number }) {
  const spot = SPOTS.find((sp) => sp.id === spotId);
  if (!spot) return null;
  const rows = calendarRows(spot, today, true);
  let top = -1;
  rows.forEach((r, i) => {
    if (r.best && (top < 0 || r.best.score > (rows[top].best?.score ?? 0))) top = i;
  });
  return (
    <ul className={s.cal} aria-label={`${spot.name}の30日先までの暦`}>
      {rows.map((r, i) => (
        <li key={r.dayStart} className={i === top ? s.calTop : ""}>
          <span className={`num ${s.calDay}`}>{jpDay(r.dayStart)}</span>
          <span className={s.calName}>{r.name}</span>
          <span className={s.calBest}>
            {r.best ? (
              <>
                <span className="num">
                  {hm(r.best.start)}–{hm(r.best.end)}
                </span>
                <small>{r.best.reason}</small>
              </>
            ) : (
              <span className="num">—</span>
            )}
          </span>
          <b className={`num ${s.calScore}`}>{r.best ? r.best.score : "—"}</b>
        </li>
      ))}
    </ul>
  );
}

function PhotoRow({ dayStart, m }: { dayStart: number; m: PhotoMoment }) {
  return (
    <li>
      <span className={`num ${s.calDay}`}>{jpDay(dayStart)}</span>
      <span className={s.calName}>{m.kind}</span>
      <span className={`num ${s.photoTime}`}>
        {hm(m.start)}–{hm(m.end)}
      </span>
      <span className={`num ${s.photoTide}`}>潮の高さ {m.tidePercent}%</span>
    </li>
  );
}

/** 撮影の「青い時間」×潮の高さ。有料は30日先まで探す、無料は今日だけ */
export function PhotoSection({ spotId, today, pro }: { spotId: string; today: number; pro: boolean }) {
  const spot = SPOTS.find((sp) => sp.id === spotId);
  if (!spot) return null;
  const list = pro ? photoMornings(spot, today, true) : [];
  return (
    <section aria-label="撮影の青い時間と潮の高さ">
      <p className={s.eyebrow}>撮影 ・ {spot.name}</p>
      <h2 className={s.h3}>空と干潟が重なる朝。</h2>
      {pro ? (
        list.length > 0 ? (
          <ul className={`${s.cal} ${s.photo}`}>
            {list.map((p) => (
              <PhotoRow key={p.dayStart} dayStart={p.dayStart} m={p.moment} />
            ))}
          </ul>
        ) : (
          <p className={s.single}>この30日には、潮が低い朝がありません。</p>
        )
      ) : (
        <>
          <ul className={`${s.cal} ${s.photo}`}>
            {photoToday(spot, today).map((m) => (
              <PhotoRow key={m.kind} dayStart={today} m={m} />
            ))}
          </ul>
          <p className={s.single}>30日先まで探すには有料プランが必要です。</p>
        </>
      )}
    </section>
  );
}
