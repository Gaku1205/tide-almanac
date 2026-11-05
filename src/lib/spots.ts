// 地点の一覧。調和定数は気象庁の実測の値。
// 出典：気象庁「潮位表掲載地点一覧表」の主要4分潮（M2・S2・K1・O1）の振幅（cm）・遅角（°）と「MSL−潮位表基準面」（cm。msl）。
//   2026年版 https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station.php （平均潮位は 2020〜2024 年の5か年平均）
//   大浦だけは 2026年版の該当行を取得できず、2024年版 https://www.data.jma.go.jp/gmd/kaiyou/db/tide/suisan/station2024.php （平均潮位は 2018〜2022 年）の値。
//   油壺・布良・赤羽根・小田原は 2024年版と 2026年版で4分潮の値が同じ。
// 取得日：2026-11-05
// 利用条件：気象庁ホームページのコンテンツは出典を書けば利用できる（https://www.jma.go.jp/jma/kishou/info/coment.html ）。画面には「潮位は気象庁の調和定数から推算」と書く。
// 位相の基準：phase は気象庁の遅角 κ（日本標準時の基準）をそのまま入れる。almanac.ts が観測点の経度 stationLon（東経）で G = κ − p·λ（p は M2・S2 が 2、K1・O1 が 1）に直して使う。
// lat・lon は釣り場の位置（日の出入りに使う）。調和定数の観測点（station・stationLon）とは別。
// 画面には引き続き「推算値」と書く（気圧・風・地形による差は入らない）。
import type { Spot } from "./almanac";

export const SPOTS: Spot[] = [
  {
    id: "jogashima",
    name: "城ヶ島",
    area: "神奈川・三浦",
    lat: 35.135,
    lon: 139.618,
    station: "油壺（Z1）",
    stationLon: 139.6167,
    msl: 93.0,
    harmonics: { M2: { amp: 35.84, phase: 146.75 }, S2: { amp: 16.92, phase: 174.38 }, K1: { amp: 23.13, phase: 176.66 }, O1: { amp: 18.14, phase: 158.1 } },
  },
  {
    id: "enoshima",
    name: "江の島",
    area: "神奈川・藤沢",
    lat: 35.3,
    lon: 139.48,
    station: "湘南港（D8）",
    stationLon: 139.4833,
    msl: 92.0,
    harmonics: { M2: { amp: 36.02, phase: 149.23 }, S2: { amp: 17.01, phase: 176.62 }, K1: { amp: 23.16, phase: 178.82 }, O1: { amp: 18.32, phase: 158.57 } },
  },
  {
    id: "sunosaki",
    name: "洲崎",
    area: "千葉・館山",
    lat: 34.975,
    lon: 139.75,
    station: "布良（MR）",
    stationLon: 139.8333,
    msl: 90.0,
    harmonics: { M2: { amp: 35.61, phase: 140.1 }, S2: { amp: 16.96, phase: 169.29 }, K1: { amp: 23.2, phase: 176.45 }, O1: { amp: 18.12, phase: 157.43 } },
  },
  {
    id: "irago",
    name: "伊良湖岬",
    area: "愛知・田原",
    lat: 34.58,
    lon: 137.01,
    station: "赤羽根（I4）",
    stationLon: 137.1833,
    msl: 105.0,
    harmonics: { M2: { amp: 44.17, phase: 167.6 }, S2: { amp: 20.34, phase: 192.28 }, K1: { amp: 22.05, phase: 182.52 }, O1: { amp: 16.41, phase: 162.9 } },
  },
  {
    id: "oura",
    name: "大浦",
    area: "佐賀・有明海",
    lat: 33.0,
    lon: 130.2,
    station: "大浦（OU）",
    stationLon: 130.2167,
    msl: 268.0,
    harmonics: { M2: { amp: 148.38, phase: 256.32 }, S2: { amp: 66.01, phase: 291.45 }, K1: { amp: 28.68, phase: 218.85 }, O1: { amp: 21.96, phase: 199.2 } },
  },
  {
    id: "kushimoto",
    name: "串本",
    area: "和歌山・串本",
    lat: 33.488,
    lon: 135.796,
    station: "串本（KS）",
    stationLon: 135.7667,
    msl: 105.0,
    harmonics: { M2: { amp: 45.8, phase: 173.47 }, S2: { amp: 20.48, phase: 196.46 }, K1: { amp: 21.84, phase: 186.62 }, O1: { amp: 16.38, phase: 166.83 } },
  },
];

export function spotById(id: string | undefined): Spot {
  return SPOTS.find((s) => s.id === id) ?? SPOTS[0];
}

/** 地点名・地域の部分一致で SPOTS を絞る。空（空白だけも）なら全地点。ひらがな・全角半角の違いは扱わない */
export function searchSpots(query: string | undefined): Spot[] {
  const q = (query ?? "").trim();
  if (q === "") return SPOTS;
  return SPOTS.filter((s) => s.name.includes(q) || s.area.includes(q));
}
