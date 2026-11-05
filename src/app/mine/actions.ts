"use server";
// 地点の追加・削除。最初に getViewer() で user を確かめ、上限は pro を見てサーバーで判定する
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authEnabled } from "@/lib/env";
import { checkAdd } from "@/lib/saved-spots";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function addSpot(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.user || !authEnabled()) redirect("/login?next=/mine");
  const spotId = String(formData.get("spot") ?? "");
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("saved_spots").select("spot_id").eq("user_id", viewer.user.id);
  if (error) redirect("/mine?e=fail");
  const saved = (data ?? []).map((r) => String(r.spot_id));
  const check = checkAdd(saved, spotId, viewer.pro);
  if (!check.ok) redirect(`/mine?e=${check.reason}`);
  const { error: insertError } = await supabase.from("saved_spots").insert({ user_id: viewer.user.id, spot_id: spotId });
  if (insertError) redirect(insertError.code === "23505" ? "/mine?e=duplicate" : "/mine?e=fail");
  revalidatePath("/mine");
  redirect("/mine");
}

export async function removeSpot(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.user || !authEnabled()) redirect("/login?next=/mine");
  const spotId = String(formData.get("spot") ?? "");
  const supabase = await supabaseServer();
  const { error } = await supabase.from("saved_spots").delete().eq("user_id", viewer.user.id).eq("spot_id", spotId);
  if (error) redirect("/mine?e=fail");
  revalidatePath("/mine");
  redirect("/mine");
}
