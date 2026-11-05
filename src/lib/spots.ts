// 地点の一覧（見本）。調和定数はおおよその値で、推算の見本として使う。本物の値に差し替えるまで、画面には「推算値」と書く
import type { Spot } from "./almanac";

export const SPOTS: Spot[] = [
  {
    id: "jogashima",
    name: "城ヶ島",
    area: "神奈川・三浦",
    lat: 35.135,
    lon: 139.618,
    msl: 104,
    harmonics: { M2: { amp: 47, phase: 148 }, S2: { amp: 22, phase: 176 }, K1: { amp: 24, phase: 182 }, O1: { amp: 19, phase: 162 } },
  },
  {
    id: "enoshima",
    name: "江の島",
    area: "神奈川・藤沢",
    lat: 35.3,
    lon: 139.48,
    msl: 102,
    harmonics: { M2: { amp: 46, phase: 150 }, S2: { amp: 21, phase: 178 }, K1: { amp: 24, phase: 183 }, O1: { amp: 19, phase: 163 } },
  },
  {
    id: "sunosaki",
    name: "洲崎",
    area: "千葉・館山",
    lat: 34.975,
    lon: 139.75,
    msl: 98,
    harmonics: { M2: { amp: 34, phase: 143 }, S2: { amp: 16, phase: 171 }, K1: { amp: 22, phase: 180 }, O1: { amp: 18, phase: 160 } },
  },
  {
    id: "irago",
    name: "伊良湖岬",
    area: "愛知・田原",
    lat: 34.58,
    lon: 137.01,
    msl: 120,
    harmonics: { M2: { amp: 52, phase: 168 }, S2: { amp: 24, phase: 198 }, K1: { amp: 23, phase: 186 }, O1: { amp: 18, phase: 166 } },
  },
  {
    id: "oura",
    name: "大浦",
    area: "佐賀・有明海",
    lat: 33.0,
    lon: 130.2,
    msl: 290,
    harmonics: { M2: { amp: 128, phase: 225 }, S2: { amp: 55, phase: 255 }, K1: { amp: 26, phase: 205 }, O1: { amp: 20, phase: 185 } },
  },
  {
    id: "wajima",
    name: "輪島",
    area: "石川・能登",
    lat: 37.4,
    lon: 136.9,
    msl: 22,
    harmonics: { M2: { amp: 7, phase: 230 }, S2: { amp: 3, phase: 260 }, K1: { amp: 8, phase: 330 }, O1: { amp: 7, phase: 300 } },
  },
];

export function spotById(id: string | undefined): Spot {
  return SPOTS.find((s) => s.id === id) ?? SPOTS[0];
}
