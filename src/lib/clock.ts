// いまの時刻。見る時刻で中身が変わる画面（今日の暦）は、ビルドのときに作り置きしない
import { connection } from "next/server";

export async function requestTime(): Promise<number> {
  await connection();
  return Date.now();
}
