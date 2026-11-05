import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const gothic = BIZ_UDPGothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-gothic", preload: false, display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "tide-almanac — 潮汐暦（潮見表・時合い・日の出入り）", template: "%s ｜ tide-almanac" },
  description: "地点ごとの潮汐曲線・満潮と干潮・日の出入り・月齢と、時合いの予告。釣り人と海辺の撮影者向けの潮汐暦。有料プランでは地点の比較と通知。",
};

export const viewport: Viewport = { themeColor: "#0B1A2A" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${gothic.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
