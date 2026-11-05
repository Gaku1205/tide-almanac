// 通知の定期実行（vercel.json の cron が毎日 21:00 JST に呼ぶ。Vercel の無料プランは1日1回まで）。CRON_SECRET が合わない呼び出しは断る
import { authEnabled, serverEnv } from "@/lib/env";
import { emailEnabled } from "@/lib/mailer";
import { runNotify, supabaseIo } from "@/lib/notify-run";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return Response.json({ skipped: true });
  if (request.headers.get("authorization") !== "Bearer " + secret) return new Response("Unauthorized", { status: 401 });
  if (!emailEnabled() || !authEnabled() || serverEnv().supabaseSecretKey === "") return Response.json({ skipped: true });
  return Response.json(await runNotify(Date.now(), supabaseIo()));
}
