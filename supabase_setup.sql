-- ============================================
-- Yappi - Supabase Database Setup
-- 在 Supabase SQL Editor 里运行这段代码
-- ============================================

-- 1. 孩子档案表
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  name text not null default '小宝贝',
  stars integer not null default 0,
  total_stars integer not null default 0,
  streak integer not null default 0,
  last_checkin_date date,
  created_at timestamptz default now()
);

-- 2. 任务完成记录表
create table if not exists task_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  task_id text not null,
  task_name text not null,
  stars_earned integer not null default 0,
  done_date date not null default current_date,
  created_at timestamptz default now(),
  unique(child_id, task_id, done_date)
);

-- 3. 奖励兑换记录表
create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  reward_id text not null,
  reward_name text not null,
  stars_cost integer not null,
  redeemed_at timestamptz default now()
);

-- 4. 开启 Row Level Security（安全策略）
alter table children enable row level security;
alter table task_logs enable row level security;
alter table redemptions enable row level security;

-- 5. 允许匿名读写（个人家庭使用场景）
create policy "allow all children" on children for all using (true) with check (true);
create policy "allow all task_logs" on task_logs for all using (true) with check (true);
create policy "allow all redemptions" on redemptions for all using (true) with check (true);

-- 6. 插入默认孩子数据
insert into children (name, stars, total_stars, streak)
values ('小宝贝', 0, 0, 0)
on conflict do nothing;
