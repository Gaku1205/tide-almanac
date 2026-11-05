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
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import s from "@/components/mine.module.css";

export const metadata: Metadata = { title: "わたしの暦" };

export default async function MinePage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/mine");
  const { e } = await searchParams;
  const now = await requestTime();
  const today = startOfJstDay(now);
  const tomorrow = today + 24 * HOUR;

  const supabase = await supabaseServer();
  const { data } = await supabase.from("saved_spots").select("spot_id").eq("user_id", viewer.user.id).order("created_at", { ascending: true });
  const saved = (data ?? []).map((r) => String(r.spot_id));
  const limit = spotLimit(viewer.pro);
  const shown = visibleSpotIds(saved, viewer.pro);
  const first = shown[0] ? spotById(shown[0]) : null;

  return (
    <>
      <SiteHeader />
      <main className={s.page}>
        <div className={`wrap ${s.stack}`}>
          <div className={s.manage}>
            <div>
              <p className={s.eyebrow}>わたしの暦</p>
              <h1 className={s.title}>
                いつもの海を、
                <br />
                登録する。
              </h1>
              <p className={s.lead}>
                {viewer.pro
                  ? "12地点まで登録できます。登録した地点の明日の時合いを、強い順に並べて比べられます。"
                  : "無料では1地点まで登録できます。その地点の今日と明日の潮と時合いを出します。"}
              </p>
              <AddSpotForm saved={saved} pro={viewer.pro} limit={limit} error={e} />
            </div>
            <SavedList ids={saved} />
          </div>

          {viewer.pro ? (
            shown.length > 0 ? (
              <section>
                <p className={s.eyebrow}>
                  <span className={s.badge}>有料</span> 地点の比較
                </p>
                <h2 className={s.h3}>どの磯へ行くか、前の晩に決まる。</h2>
                <CompareBoard spotIds={shown} dayStart={tomorrow} />
                {shown.length === 1 ? <p className={s.single}>地点を足すと、強い順に並べて比べられます。</p> : null}
                <p className={s.estimate}>※ 潮位は推算値（気象庁の調和定数から推算）。気圧や風による差は含みません。</p>
              </section>
            ) : null
          ) : first ? (
            <section className={s.days}>
              <DayBlock a={dayAlmanac(first, today)} now={now} />
              <DayBlock a={dayAlmanac(first, tomorrow)} now={now} />
              <p className={s.estimate}>※ 潮位は推算値（気象庁の調和定数から推算）。気圧や風による差は含みません。</p>
              <div className={s.upsell}>
                <p>有料プランなら、12地点まで登録して、明日の時合いを強い順に比べられます。</p>
                <Link href="/pricing" className="btn btnGhost">
                  有料プランを見る
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
