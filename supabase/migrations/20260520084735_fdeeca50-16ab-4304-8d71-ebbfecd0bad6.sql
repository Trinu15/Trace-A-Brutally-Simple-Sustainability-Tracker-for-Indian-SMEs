
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  product_type text not null,
  units integer not null default 0,
  start_date date not null default current_date,
  raw_material text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.resource_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  resource_type text not null,
  amount numeric not null default 0,
  subtype text,
  note text,
  log_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index on public.resource_logs(batch_id);
create index on public.batches(start_date desc);

alter table public.batches enable row level security;
alter table public.resource_logs enable row level security;

create policy "public read batches" on public.batches for select using (true);
create policy "public insert batches" on public.batches for insert with check (true);
create policy "public update batches" on public.batches for update using (true);
create policy "public delete batches" on public.batches for delete using (true);

create policy "public read logs" on public.resource_logs for select using (true);
create policy "public insert logs" on public.resource_logs for insert with check (true);
create policy "public update logs" on public.resource_logs for update using (true);
create policy "public delete logs" on public.resource_logs for delete using (true);

-- Seed demo factory: 6 historical garment batches
with seeded as (
  insert into public.batches (batch_id, product_type, units, start_date, raw_material, completed) values
    ('B241', 'garment', 2800, current_date - 170, 'Cotton knit', true),
    ('B242', 'garment', 3200, current_date - 140, 'Cotton knit', true),
    ('B243', 'garment', 1500, current_date - 110, 'Polyester blend', true),
    ('B244', 'garment', 3000, current_date - 80,  'Cotton knit', true),
    ('B245', 'garment', 2200, current_date - 50,  'Cotton knit', true),
    ('B246', 'garment', 3500, current_date - 20,  'Cotton knit', true)
  returning id, batch_id, units, start_date
)
insert into public.resource_logs (batch_id, resource_type, amount, subtype, log_date)
select s.id, r.resource_type, r.amount, r.subtype, s.start_date + 1
from seeded s
cross join lateral (values
  ('water'::text,       (s.units * (40 + (random()*30)))::numeric, 'municipal'::text),
  ('electricity',       (s.units * (1.6 + (random()*1.2)))::numeric, null),
  ('fuel',              (s.units * 0.05)::numeric, 'diesel'),
  ('waste',             (s.units * 0.08)::numeric, case when s.batch_id in ('B243','B245') then 'landfill' else 'recycler' end)
) as r(resource_type, amount, subtype);
