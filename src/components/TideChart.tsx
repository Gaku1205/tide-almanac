import { HOUR, hm, tideLevel, type DayAlmanac } from "@/lib/almanac";
import { areaPath, band, frameFor, linePath, mobileTags, pct } from "@/lib/chart";
import { strengthKey, strengthOf } from "@/lib/strength";
import s from "./TideChart.module.css";

type Props = {
  a: DayAlmanac;
  /** いまの時刻（その日の中なら印を出す） */
  now?: number;
  tone?: "night" | "paper";
  /** 満潮・干潮の札と、時合いの札を出すか */
  labels?: boolean;
  /** 図の高さの比（幅に対して） */
  ratio?: number;
  /** 640px 以下の幅での高さの比（無ければ ratio と同じ） */
  ratioSm?: number;
  /** 下の時刻の目盛りを出すか */
  axis?: boolean;
  title?: string;
  /** 何枚か並べるとき、潮位の物差しをそろえる（cm） */
  domain?: { lo: number; hi: number };
};

export function TideChart({ a, now, tone = "night", labels = true, ratio = 0.3, ratioSm, axis = true, title, domain }: Props) {
  const from = a.dayStart;
  const to = a.dayStart + 24 * HOUR;
  const f = frameFor(domain ? [{ t: from, h: domain.lo }, { t: to, h: domain.hi }] : a.series, from, to);
  const gid = `g-${a.spot.id}-${tone}-${labels ? 1 : 0}`;
  const night1 = band(f, from, a.sun.dawn);
  const twi1 = band(f, a.sun.dawn, a.sun.rise);
  const twi2 = band(f, a.sun.set, a.sun.dusk);
  const night2 = band(f, a.sun.dusk, to);
  const showNow = now !== undefined && now >= from && now <= to;
  const nowAt = showNow ? pct(f, now, tideLevel(a.spot, now)) : null;
  const best = a.windows.reduce<DayAlmanac["windows"][number] | null>((m, w) => (!m || w.score > m.score ? w : m), null);
  const bestLeft = best ? pct(f, (best.start + best.end) / 2).left : 0;
  // 640px 以下での札の置き方（重なるときは動かす・省く。判定は lib/chart.ts）
  const mobile = mobileTags({
    highs: a.extremes.filter((e) => e.kind === "high").map((e) => pct(f, e.t, e.h).left),
    lows: a.extremes.filter((e) => e.kind === "low").map((e) => pct(f, e.t, e.h).left),
    now: nowAt ? nowAt.left : null,
    best: best ? bestLeft : null,
  });
  const label =
    title ??
    `${a.spot.name}の潮汐。満潮 ${a.extremes.filter((e) => e.kind === "high").map((e) => hm(e.t)).join("・")}、干潮 ${a.extremes
      .filter((e) => e.kind === "low")
      .map((e) => hm(e.t))
      .join("・")}。時合い ${a.windows.map((w) => `${hm(w.start)}〜${hm(w.end)}`).join("、")}`;

  return (
    <figure className={`${s.chart} ${tone === "paper" ? s.paper : s.night}`} role="img" aria-label={label}>
      <div
        className={s.plot}
        style={{ "--ar": `${1 / ratio}`, "--ar-sm": `${1 / (ratioSm ?? ratio)}` } as React.CSSProperties}
      >
        <svg viewBox={`0 0 ${f.w} ${f.h}`} preserveAspectRatio="none" className={s.svg} aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--ink)" }} stopOpacity={tone === "paper" ? 0.3 : 0.34} />
              <stop offset="1" style={{ stopColor: "var(--ink)" }} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect className={s.dark} x={night1.x} y="0" width={night1.w} height={f.h} />
          <rect className={s.twilight} x={twi1.x} y="0" width={twi1.w} height={f.h} />
          <rect className={s.twilight} x={twi2.x} y="0" width={twi2.w} height={f.h} />
          <rect className={s.dark} x={night2.x} y="0" width={night2.w} height={f.h} />
          {[3, 6, 9, 12, 15, 18, 21].map((h) => (
            <line key={h} className={s.grid} x1={(h / 24) * f.w} x2={(h / 24) * f.w} y1="0" y2={f.h} vectorEffect="non-scaling-stroke" />
          ))}
          {a.windows.map((w) => {
            const b = band(f, w.start, w.end);
            return (
              <g key={w.start} className={s[strengthKey(w.score)]}>
                <rect className={s.jiai} x={b.x} y="0" width={b.w} height={f.h} />
                <rect className={s.jiaiTop} x={b.x} y="0" width={b.w} height="5" />
              </g>
            );
          })}
          <g className={s.tideInk}>
            <path d={areaPath(f, a.series)} fill={`url(#${gid})`} className={s.fill} />
            <path d={linePath(f, a.series)} className={s.line} vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        {labels
          ? a.extremes.map((e) => {
              const p = pct(f, e.t, e.h);
              const edge = p.left < 7 ? s.alignL : p.left > 93 ? s.alignR : "";
              return (
                <span key={e.t} className={`${s.ext} ${e.kind === "high" ? s.high : s.low} ${edge}`} style={{ left: `${p.left}%`, top: `${p.top}%` }}>
                  <b>{e.kind === "high" ? "満" : "干"}</b>
                  <span className="num">{hm(e.t)}</span>
                  <span className={`num ${s.cm}`}>{Math.round(e.h)}cm</span>
                </span>
              );
            })
          : null}

        {labels && best ? (
          <span
            className={`${s.jiaiTag} ${mobile.jiai?.row === "top" ? s.jiaiTagTop : ""} ${mobile.jiai ? "" : s.jiaiTagHide}`}
            style={{ "--l": `${bestLeft}%`, "--l-sm": `${mobile.jiai?.left ?? bestLeft}%` } as React.CSSProperties}
          >
            時合い {strengthOf(best.score)}
          </span>
        ) : null}

        {nowAt ? (
          <span className={s.now} style={{ left: `${nowAt.left}%` }} aria-hidden="true">
            <span className={s.nowDot} style={{ top: `${nowAt.top}%` }} />
            {labels ? (
              <span className={`${s.nowTag} ${mobile.nowTag === "left" ? s.nowTagL : ""} ${mobile.nowTag === "none" ? s.nowTagHide : ""} num`}>
                いま {hm(now!)}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      {axis ? (
        <div className={`${s.axis} ${labels ? s.axisLow : ""}`} aria-hidden="true">
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
            <span key={h} className="num" style={{ left: `${(h / 24) * 100}%` }}>
              {h}
            </span>
          ))}
          <span className={`${s.sun} num`} style={{ left: `${pct(f, a.sun.rise).left}%` }}>
            <i /> 日の出 {hm(a.sun.rise)}
          </span>
          <span className={`${s.sun} ${s.sunSet} num`} style={{ left: `${pct(f, a.sun.set).left}%` }}>
            <i /> 日の入り {hm(a.sun.set)}
          </span>
        </div>
      ) : null}
    </figure>
  );
}
