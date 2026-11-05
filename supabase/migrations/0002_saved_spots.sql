-- 「わたしの暦」で登録した地点。自分の行だけ読める・書ける。
-- 上限（無料 1・有料 12）はサーバー（src/lib/saved-spots.ts）で確かめる。地点の id は src/lib/spots.ts の物。

create table if not exists public.saved_spots (
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.saved_spots enable row level security;

drop policy if exists "自分の地点だけ読める" on public.saved_spots;
create policy "自分の地点だけ読める" on public.saved_spots for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "自分の地点だけ足せる" on public.saved_spots;
create policy "自分の地点だけ足せる" on public.saved_spots for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "自分の地点だけ更新できる" on public.saved_spots;
create policy "自分の地点だけ更新できる" on public.saved_spots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "自分の地点だけ消せる" on public.saved_spots;
create policy "自分の地点だけ消せる" on public.saved_spots for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.saved_spots to authenticated;
