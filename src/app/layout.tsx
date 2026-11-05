import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho_B1({ weight: ["600", "700"], subsets: ["latin"], variable: "--font-mincho", preload: false, display: "swap" });
const gothic = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-gothic", preload: false, display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "tide-almanac — 潮と光が重なる刻を、前の晩に。", template: "%s ｜ tide-almanac" },
  description: "釣り人と海辺の撮影者のための潮汐暦。地点ごとの潮と日の出入り・月齢を読み合わせて、時合いを予告します。有料プランでは複数地点の比較と通知。",
};

export const viewport: Viewport = { themeColor: "#0B1A2A" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${mincho.variable} ${gothic.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
