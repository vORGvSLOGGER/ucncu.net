-- ============================================================
--  UCNCU.NET — مخطط قاعدة بيانات الطور الحقيقي (Supabase / Postgres)
--  الصق هذا الملف كاملًا في:  Supabase → SQL Editor → New query → Run
--  آمن لإعادة التشغيل (يستخدم IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- 1) حفظ تقدم اللاعب في السحابة (سجل لكل مستخدم)
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  state      jsonb not null,
  net_worth  bigint default 0,
  level      int default 1,
  updated_at timestamptz default now()
);
alter table public.saves enable row level security;
drop policy if exists "saves own read"  on public.saves;
drop policy if exists "saves own write" on public.saves;
create policy "saves own read"  on public.saves for select using (auth.uid() = user_id);
create policy "saves own write" on public.saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) لوحة المتصدرين المشتركة (قراءة للجميع، كتابة لصاحبها فقط)
create table if not exists public.leaderboard (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  net_worth  bigint default 0,
  level      int default 1,
  fame       bigint default 0,
  updated_at timestamptz default now()
);
alter table public.leaderboard enable row level security;
drop policy if exists "lb read all"  on public.leaderboard;
drop policy if exists "lb own write" on public.leaderboard;
create policy "lb read all"  on public.leaderboard for select using (auth.role() = 'authenticated');
create policy "lb own write" on public.leaderboard for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) الفيد الاجتماعي المشترك (إكسبلور) — قراءة للجميع، نشر لصاحبه
create table if not exists public.feed_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references auth.users (id) on delete set null,
  author_name text not null,
  kind        text not null default 'user',
  text        text not null,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);
alter table public.feed_posts enable row level security;
drop policy if exists "feed read all"   on public.feed_posts;
drop policy if exists "feed own insert" on public.feed_posts;
create policy "feed read all"   on public.feed_posts for select using (auth.role() = 'authenticated');
create policy "feed own insert" on public.feed_posts for insert with check (auth.uid() = author_id);

-- 4) الحظر النهائي عند الإفلاس (طور الحقيقة فقط)
create table if not exists public.banned_emails (
  email     text primary key,
  reason    text,
  banned_at timestamptz default now()
);
alter table public.banned_emails enable row level security;
drop policy if exists "ban read all"  on public.banned_emails;
drop policy if exists "ban self"      on public.banned_emails;
create policy "ban read all" on public.banned_emails for select using (auth.role() = 'authenticated');
-- يسمح للاعب بحظر بريده هو فقط (يقع تلقائيًا عند الإفلاس النهائي)
create policy "ban self" on public.banned_emails for insert
  with check (lower(email) = lower((auth.jwt() ->> 'email')));

-- ============================================================
--  بعد التشغيل:
--  1) Authentication → Providers → Email: فعّل، وعطّل "Confirm email"
--     أو اضبط قالب Magic Link ليتضمن {{ .Token }} (رمز 6 أرقام).
--  2) أضف في GitHub → Settings → Secrets and variables → Actions:
--       NEXT_PUBLIC_SUPABASE_URL
--       NEXT_PUBLIC_SUPABASE_ANON_KEY
--       NEXT_PUBLIC_ADMIN_EMAILS   (اختياري، إيميلات الإدارة مفصولة بفواصل)
-- ============================================================
