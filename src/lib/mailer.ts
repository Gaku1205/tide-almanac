// メール配信サービス（既定は Resend）の HTTP API を呼ぶ。サーバーだけで使う。鍵は環境変数から読む
export function emailEnabled(): boolean {
  return (process.env.EMAIL_API_KEY ?? "") !== "" && (process.env.EMAIL_FROM ?? "") !== "";
}

export type Mail = { to: string; subject: string; text: string };

/** 送れたら true。鍵か送信元が無いときは何も送らず false */
export async function sendMail(mail: Mail): Promise<boolean> {
  const key = process.env.EMAIL_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
