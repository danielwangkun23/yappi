-- ============================================
-- Yappi v3 - 完整数据库结构重建
-- ============================================
drop table if exists redemptions cascade;
drop table if exists task_logs cascade;
drop table if exists rewards cascade;
drop table if exists tasks cascade;
drop table if exists children cascade;
drop table if exists parents cascade;
drop table if exists task_templates cascade;

-- 1. 家长表（用户名+PIN）
create table parents (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  pin text not null,
  created_at timestamptz default now()
);

-- 2. 孩子表
create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  name text not null,
  avatar text not null default '🐣',
  stars integer not null default 0,
  total_stars integer not null default 0,
  streak integer not null default 0,
  last_checkin_date date,
  created_at timestamptz default now()
);

-- 3. 任务表
create table tasks (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  name text not null,
  description text not null default '',
  emoji text not null default '⭐',
  category text not null default '习惯',  -- 学习/习惯/品德/运动/其他
  stars integer not null default 3,
  frequency text not null default 'daily', -- daily/weekday/saturday/sunday
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 4. 任务模板表
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade, -- null=内置模板
  name text not null,
  description text not null default '',
  emoji text not null default '⭐',
  category text not null default '习惯',
  stars integer not null default 3,
  frequency text not null default 'daily',
  is_builtin boolean not null default false,
  created_at timestamptz default now()
);

-- 5. 奖励表
create table rewards (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  name text not null,
  emoji text not null default '🎁',
  cost integer not null default 20,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 6. 任务完成记录
create table task_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  task_id uuid,
  task_name text not null,
  category text not null default '习惯',
  stars_earned integer not null default 0,
  done_date date not null default current_date,
  note text default '',
  created_at timestamptz default now()
);

-- 7. 兑换记录
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  reward_id uuid,
  reward_name text not null,
  stars_cost integer not null,
  redeemed_at timestamptz default now()
);

-- RLS
alter table parents enable row level security;
alter table children enable row level security;
alter table tasks enable row level security;
alter table task_templates enable row level security;
alter table rewards enable row level security;
alter table task_logs enable row level security;
alter table redemptions enable row level security;

create policy "allow all" on parents for all using (true) with check (true);
create policy "allow all" on children for all using (true) with check (true);
create policy "allow all" on tasks for all using (true) with check (true);
create policy "allow all" on task_templates for all using (true) with check (true);
create policy "allow all" on rewards for all using (true) with check (true);
create policy "allow all" on task_logs for all using (true) with check (true);
create policy "allow all" on redemptions for all using (true) with check (true);

-- 内置任务模板
insert into task_templates (name, description, emoji, category, stars, frequency, is_builtin) values
('刷牙洁净','早晚各刷2分钟','🦷','习惯',3,'daily',true),
('洗脸洗手','保持清洁卫生','🧼','习惯',2,'daily',true),
('整理书包','提前准备好第二天','🎒','习惯',3,'weekday',true),
('整理小房间','玩具放回原位','🧸','习惯',4,'daily',true),
('早睡早起','按时上床不赖床','💤','习惯',3,'daily',true),
('阅读30分钟','读课外书或绘本','📚','学习',5,'daily',true),
('完成作业','认真独立完成作业','📝','学习',6,'weekday',true),
('练习写字','认真练习笔画','✏️','学习',4,'weekday',true),
('背单词','每天背5个英语单词','🔤','学习',4,'weekday',true),
('练钢琴','认真练习30分钟','🎹','学习',5,'daily',true),
('帮忙做家务','帮爸爸妈妈做家务','🧹','品德',4,'daily',true),
('帮助家人','主动做一件好事','🌈','品德',3,'daily',true),
('不发脾气','遇事冷静不哭闹','😊','品德',5,'daily',true),
('分享玩具','和小朋友友好分享','🤝','品德',4,'daily',true),
('户外运动','跑步/骑车/跳绳','🏃','运动',5,'daily',true),
('做体操','认真做广播体操','🤸','运动',3,'weekday',true);
