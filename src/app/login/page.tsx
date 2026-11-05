import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/billing";
import { getViewer } from "@/lib/viewer";
import { Logo } from "@/components/SiteHeader";
import { LoginForm } from "./LoginForm";
import s from "@/components/member.module.css";

export const metadata: Metadata = { title: "ログイン" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const to = safeNext(next);
  const viewer = await getViewer();
  if (viewer.user) redirect(to);
  return (
    <main className={s.split}>
      <div className={s.visual}>
        <Image src="/photos/01-fisherman-sunrise-sea.jpg" alt="夕方の溶岩の磯で、竿を持って海を見る人" fill priority sizes="(max-width: 900px) 100vw, 50vw" className={s.cover} />
        <div className={s.visualShade} />
        <Link href="/" className={s.visualMark} aria-label="tide-almanac トップへ">
          <Logo />
          <span>
            tide-almanac
            <small>潮汐暦</small>
          </span>
        </Link>
      </div>

      <div className={s.panel}>
        <div className={s.panelInner}>
          <h1 className={s.title}>ログイン・登録</h1>
          <p className={s.lead}>はじめての人は、メールアドレスとパスワードを入れて「新しく登録する」。登録は無料で、すぐに一地点の暦が使えます。</p>
          <LoginForm next={to} />
          <p className={s.fine}>
            <Link href="/pricing">料金とできること</Link> ・ <Link href="/">トップへ戻る</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
