// 地点の一覧。調和定数（M2・S2・K1・O1 の振幅 cm・遅角 °）と平均潮位（msl）は、気象庁「潮位表掲載地点一覧表」の値。
// 出典：気象庁 潮位表掲載地点一覧表 https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station.php （2026年版。平均潮位は 2020〜2024 年の5か年平均）
//   大浦だけは 2026年版の該当行を取得できず、2024年版 https://www.data.jma.go.jp/gmd/kaiyou/db/tide/suisan/station2024.php （平均潮位は 2018〜2022 年）の値。
// 利用条件：気象庁ホームページのコンテンツは、出典を書けば利用できる（https://www.jma.go.jp/jma/kishou/info/coment.html ）。画面には「潮位は気象庁の調和定数から推算」と書く。
// 取得日：2026-11-05
// msl は「MSL−潮位表基準面」（cm）。phase は気象庁の遅角 κ（日本標準時 135°E 基準）で、そのまま書く。
//   almanac.ts の tideLevel が、観測点の経度 λ（stationLon。東経）で G = κ − p·λ（p は M2・S2 が 2、K1・O1 が 1）に直してから使う。
// 調和定数は観測点の値。lat・lon は日の出入りに使う釣り場の位置で、観測点の位置とは別。
// 潮位は4分潮だけの推算なので、小潮のころは公表の満干の時刻から1時間以上ずれることがある。画面には「推算値」と書き添える。
import type { Spot } from "./almanac";

export const SPOTS: Spot[] = [
  {
    id: "jogashima",
    name: "城ヶ島",
    area: "神奈川・三浦",
    lat: 35.135,
    lon: 139.618,
    msl: 93.0,
    station: "油壺（Z1）",
    stationLon: 139.617,
    harmonics: { M2: { amp: 35.84, phase: 146.75 }, S2: { amp: 16.92, phase: 174.38 }, K1: { amp: 23.13, phase: 176.66 }, O1: { amp: 18.14, phase: 158.1 } },
  },
  {
    id: "enoshima",
    name: "江の島",
    area: "神奈川・藤沢",
    lat: 35.3,
    lon: 139.48,
    msl: 92.0,
    station: "湘南港（D8）",
    stationLon: 139.483,
    harmonics: { M2: { amp: 36.02, phase: 149.23 }, S2: { amp: 17.01, phase: 176.62 }, K1: { amp: 23.16, phase: 178.82 }, O1: { amp: 18.32, phase: 158.57 } },
  },
  {
    id: "sunosaki",
    name: "洲崎",
    area: "千葉・館山",
    lat: 34.975,
    lon: 139.75,
    msl: 90.0,
    station: "布良（MR）",
    stationLon: 139.833,
    harmonics: { M2: { amp: 35.61, phase: 140.1 }, S2: { amp: 16.96, phase: 169.29 }, K1: { amp: 23.2, phase: 176.45 }, O1: { amp: 18.12, phase: 157.43 } },
  },
  {
    id: "irago",
    name: "伊良湖岬",
    area: "愛知・田原",
    lat: 34.58,
    lon: 137.01,
    msl: 105.0,
    station: "赤羽根（I4）",
    stationLon: 137.183,
    harmonics: { M2: { amp: 44.17, phase: 167.6 }, S2: { amp: 20.34, phase: 192.28 }, K1: { amp: 22.05, phase: 182.52 }, O1: { amp: 16.41, phase: 162.9 } },
  },
  {
    id: "oura",
    name: "大浦",
    area: "佐賀・有明海",
    lat: 33.0,
    lon: 130.2,
    msl: 268.0,
    station: "大浦（OU）",
    stationLon: 130.217,
    harmonics: { M2: { amp: 148.38, phase: 256.32 }, S2: { amp: 66.01, phase: 291.45 }, K1: { amp: 28.68, phase: 218.85 }, O1: { amp: 21.96, phase: 199.2 } },
  },
  {
    id: "kushimoto",
    name: "串本",
    area: "和歌山・串本",
    lat: 33.488,
    lon: 135.796,
    msl: 105.0,
    station: "串本（KS）",
    stationLon: 135.767,
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
