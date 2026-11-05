"use server";
// 通知の設定の保存（有料のみ）。最初に getViewer() で user と pro をサーバーで確かめ、値を検証してから RLS つきで保存する
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authEnabled } from "@/lib/env";
import { parseThreshold } from "@/lib/notifications";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function saveNotificationSettings(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.user || !authEnabled()) redirect("/login?next=/account");
  if (!viewer.pro) redirect("/account?n=pro");
  const threshold = parseThreshold(String(formData.get("threshold") ?? ""));
  if (threshold === null) redirect("/account?n=invalid");
  const supabase = await supabaseServer();
  const { error } = await supabase.from("notification_settings").upsert(
    {
      user_id: viewer.user.id,
      jiai_enabled: formData.get("jiai") === "on",
      low_tide_enabled: formData.get("lowTide") === "on",
      low_tide_threshold_cm: threshold,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) redirect("/account?n=fail");
  revalidatePath("/account");
  redirect("/account?n=saved");
}
