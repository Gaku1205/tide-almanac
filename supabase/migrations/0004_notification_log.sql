-- 通知の送信の記録。同じ通知を二重に送らないための表（一意制約）。
-- 読み書きはサーバーの supabaseAdmin() だけ。RLS を有効にし、一般の policy も authenticated への grant も付けない。

create table if not exists public.notification_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id text not null,
  kind text not null check (kind in ('jiai-evening', 'jiai-before', 'low-tide')),
  send_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (user_id, spot_id, kind, send_at)
);

alter table public.notification_log enable row level security;

revoke all on public.notification_log from anon, authenticated;
grant select, insert, delete on public.notification_log to service_role;
