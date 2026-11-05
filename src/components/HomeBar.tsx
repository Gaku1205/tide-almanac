// トップの上の帯：しるし・地点の切り替え（#3 の検索）・日付の切り替え・ログイン（docs/design.md「トップの上の帯」）
import Link from "next/link";
import type { Spot } from "@/lib/almanac";
import { homeHref, type DayChip } from "@/lib/home";
import { SPOTS } from "@/lib/spots";
import { Lock } from "./Lock";
import { Logo } from "./SiteHeader";
import s from "./HomeBar.module.css";

type Props = {
  spot: Spot;
  q: string;
  found: Spot[];
  day: number;
  chips: DayChip[];
  loggedIn: boolean;
};

export function HomeBar({ spot, q, found, day, chips, loggedIn }: Props) {
  return (
    <header className={s.bar}>
      <div className={`wrap ${s.inner}`}>
        <Link href="/" className={s.mark} aria-label="tide-almanac トップへ">
          <Logo size={24} />
          <span className="num">tide-almanac</span>
        </Link>

        <details className={s.picker} open={q !== ""}>
          <summary className={s.pickerSum}>
            <span className={s.pickerLabel}>地点</span>
            <b>{spot.name}</b>
            <span aria-hidden="true" className={s.caret}>
              ▾
            </span>
          </summary>
          <div className={s.panel}>
            <form method="get" action="/" role="search" className={s.form}>
              <input type="hidden" name="spot" value={spot.id} />
              {day ? <input type="hidden" name="d" value={day} /> : null}
              <label htmlFor="spot-q" className="sr">
                地点名・地域
              </label>
              <input id="spot-q" name="q" type="search" defaultValue={q} placeholder="例：江の島、神奈川" className={s.input} autoComplete="off" />
              <button type="submit" className={`btn btnGhost ${s.go}`}>
                探す
              </button>
            </form>
            <p className={s.count} role="status">
              {q === "" ? `見本の${SPOTS.length}地点` : found.length > 0 ? `「${q}」に合う地点 ${found.length}件` : ""}
            </p>
            {found.length > 0 ? (
              <ul className={s.list}>
                {found.map((sp) => (
                  <li key={sp.id}>
                    <Link href={homeHref({ spot: sp.id, q, d: day })} className={s.item} aria-current={sp.id === spot.id ? "true" : undefined}>
                      <b>{sp.name}</b>
                      <small>{sp.area}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.empty}>「{q}」に合う地点は見つかりませんでした。地点名か地域（例：神奈川）を短く入れてみてください。</p>
            )}
          </div>
        </details>

        <nav className={s.days} aria-label="日付">
          {chips.map((c) =>
            c.locked ? (
              <Link key={c.offset} href={c.href} className={`${s.day} ${s.dayLocked}`} aria-label={`${c.label}は有料プランで見られます`}>
                <span className="num">{c.label}</span>
                <Lock />
              </Link>
            ) : (
              <Link key={c.offset} href={c.href} className={`${s.day} ${c.offset === day ? s.dayOn : ""}`} aria-current={c.offset === day ? "date" : undefined}>
                <span className={c.offset >= 2 ? "num" : undefined}>{c.label}</span>
              </Link>
            ),
          )}
        </nav>

        <div className={s.end}>
          <Link href="/pricing" className={s.textLink}>
            料金
          </Link>
          <Link href={loggedIn ? "/mine" : "/login"} className={s.login}>
            {loggedIn ? "わたしの暦" : "ログイン"}
          </Link>
        </div>
      </div>
    </header>
  );
}
