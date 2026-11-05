-- アカウントの通知の設定（有料のみ。保存はサーバー（src/app/account/actions.ts）で pro を確かめてから）。
-- 自分の行だけ読める・書ける。実際の送信は別の作業（#5）。

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  jiai_enabled boolean not null default false,
  low_tide_enabled boolean not null default false,
  low_tide_threshold_cm integer not null default 30 check (low_tide_threshold_cm between 0 and 200),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "自分の通知設定だけ読める" on public.notification_settings;
create policy "自分の通知設定だけ読める" on public.notification_settings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "自分の通知設定だけ足せる" on public.notification_settings;
create policy "自分の通知設定だけ足せる" on public.notification_settings for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "自分の通知設定だけ更新できる" on public.notification_settings;
create policy "自分の通知設定だけ更新できる" on public.notification_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "自分の通知設定だけ消せる" on public.notification_settings;
create policy "自分の通知設定だけ消せる" on public.notification_settings for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.notification_settings to authenticated;
