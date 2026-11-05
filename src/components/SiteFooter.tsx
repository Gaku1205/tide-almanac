import Link from "next/link";
import { Logo } from "./SiteHeader";
import s from "./chrome.module.css";

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.footGrid}`}>
        <div className={s.footBrand}>
          <span className={s.mark}>
            <Logo size={32} />
            <span className={s.word}>
              tide-almanac
              <small>潮汐暦</small>
            </span>
          </span>
          <p>釣り人と海辺の撮影者のための潮汐暦</p>
        </div>
        <nav className={s.footNav} aria-label="下のメニュー">
          <Link href="/">トップ</Link>
          <Link href="/#read">暦の読み方</Link>
          <Link href="/pricing">料金</Link>
          <Link href="/login">ログイン・登録</Link>
        </nav>
        <p className={s.footNote}>
          <span>潮位は気象庁の調和定数から推算した値、日の出入りは天文の計算です。実際の潮位は、気圧・風・地形で数十cm変わることがあります。海に出る前は、必ず現地の情報と気象の注意報を確かめてください。</span>
        </p>
      </div>
    </footer>
  );
}
