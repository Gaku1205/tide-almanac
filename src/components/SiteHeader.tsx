import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import s from "./chrome.module.css";

/** 上の帯。tone は下に来る面の色（夜の紺か、暦の紙か） */
export async function SiteHeader({ tone = "night" }: { tone?: "night" | "paper" }) {
  const viewer = await getViewer();
  return (
    <header className={`${s.header} ${tone === "paper" ? s.onPaper : ""}`}>
      <div className={`wrap ${s.bar}`}>
        <Link href="/" className={s.mark} aria-label="tide-almanac トップへ">
          <Logo />
          <span className={s.word}>
            tide-almanac
            <small>潮汐暦</small>
          </span>
        </Link>
        <nav className={s.nav} aria-label="メイン">
          <Link href="/#read" className={s.hideSm}>
            暦の読み方
          </Link>
          <Link href="/pricing">料金</Link>
          {viewer.user ? (
            <>
              <Link href="/mine">わたしの暦</Link>
              <Link href="/account" className={s.pill}>
                アカウント
              </Link>
            </>
          ) : (
            <Link href="/login" className={s.pill}>
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

/** しるし：朱の日の丸が、潮の線から半分のぞく */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="17" r="9" fill="var(--shu)" />
      <path d="M1 18.5c3.8 0 3.8-2.6 7.5-2.6s3.8 2.6 7.5 2.6 3.8-2.6 7.5-2.6 3.8 2.6 7.5 2.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 24c3.8 0 3.8-2.6 7.5-2.6S12.3 24 16 24s3.8-2.6 7.5-2.6S27.3 24 31 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}
