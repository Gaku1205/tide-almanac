import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HOUR, dayAlmanac, startOfJstDay } from "@/lib/almanac";
import { requestTime } from "@/lib/clock";
import { spotLimit, visibleSpotIds } from "@/lib/saved-spots";
import { spotById } from "@/lib/spots";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { AddSpotForm, CompareBoard, DayBlock, SavedList } from "@/components/MineParts";
import { MonthCalendar, PhotoSection, SpotTabs } from "@/components/ForecastParts";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import s from "@/components/mine.module.css";

export const metadata: Metadata = { title: "わたしの暦" };

export default async function MinePage({ searchParams }: { searchParams: Promise<{ e?: string; spot?: string }> }) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/mine");
  const { e, spot: spotParam } = await searchParams;
  const now = await requestTime();
  const today = startOfJstDay(now);
  const tomorrow = today + 24 * HOUR;

  const supabase = await supabaseServer();
  const { data } = await supabase.from("saved_spots").select("spot_id").eq("user_id", viewer.user.id).order("created_at", { ascending: true });
  const saved = (data ?? []).map((r) => String(r.spot_id));
  const limit = spotLimit(viewer.pro);
  const shown = visibleSpotIds(saved, viewer.pro);
  const first = shown[0] ? spotById(shown[0]) : null;
  const current = spotParam && shown.includes(spotParam) ? spotParam : (shown[0] ?? "");

  return (
    <>
      <SiteHeader />
      <main className={s.page}>
        <div className={`wrap ${s.stack}`}>
          <div className={s.manage}>
            <div>
              <h1 className={s.title}>わたしの暦</h1>
              <p className={s.lead}>
                {viewer.pro
                  ? "12地点まで登録できます。登録した地点の明日の時合いを、強い順に並べて比べられます。"
                  : "無料では1地点まで登録できます。その地点の今日と明日の潮と時合いを出します。"}
              </p>
              <AddSpotForm saved={saved} pro={viewer.pro} limit={limit} error={e} />
            </div>
            <SavedList ids={saved} />
          </div>

          {viewer.pro && shown.length > 0 ? (
            <section>
              <h2 className={s.h2}>
                <span className={s.badge}>有料</span> 地点の比較
              </h2>
              <CompareBoard spotIds={shown} dayStart={tomorrow} />
              {shown.length === 1 ? <p className={s.single}>地点を足すと、強い順に並べて比べられます。</p> : null}
            </section>
          ) : null}

          {viewer.pro && shown.length > 0 ? (
            <>
              <section>
                <h2 className={s.h2}>
                  <span className={s.badge}>有料</span> 30日先までの暦
                </h2>
                <SpotTabs ids={shown} current={current} />
                <MonthCalendar spotId={current} today={today} />
              </section>
              <PhotoSection spotId={current} today={today} pro />
              <p className={s.estimate}>※ 潮位は推算値（気象庁の調和定数から推算）。気圧や風による差は含みません。</p>
            </>
          ) : null}

          {!viewer.pro && first ? (
            <>
              <section className={s.days}>
                <DayBlock a={dayAlmanac(first, today)} now={now} />
                <DayBlock a={dayAlmanac(first, tomorrow)} now={now} />
              </section>
              <PhotoSection spotId={first.id} today={today} pro={false} />
              <p className={s.estimate}>※ 潮位は推算値（気象庁の調和定数から推算）。気圧や風による差は含みません。</p>
              <div className={s.upsell}>
                <p>有料プランなら、12地点まで登録して明日の時合いを強い順に比べられます。30日先までの暦と、撮影の青い時間×潮の高さも見られます。</p>
                <Link href="/pricing" className="btn btnGhost">
                  有料プランを見る
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
