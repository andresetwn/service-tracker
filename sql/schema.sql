-- =============================================================================
-- Vehicle Repair History Tracker — Database Schema
-- -----------------------------------------------------------------------------
-- Jalankan seluruh isi file ini di Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- Semua akses data aplikasi melalui SERVICE ROLE KEY (server-side only, lihat
-- lib/supabase.ts). RLS diaktifkan tanpa policy -> anon key tidak memiliki
-- akses sama sekali. Lihat catatan keamanan di bagian bawah file ini.
-- =============================================================================

-- Needed for gen_random_uuid() (aktif secara default di Supabase)
create extension if not exists pgcrypto;

-- =============================================================================
-- Tables
-- =============================================================================

-- Kendaraan (section 4 AGENTS.md)
create table if not exists public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  brand         text,
  model         text,
  year          int,
  police_number text,
  current_km    bigint not null default 0 check (current_km >= 0),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint vehicles_year_sane
    check (year is null or (year between 1900 and (extract(year from now())::int + 1)))
);

comment on table public.vehicles is
  'Kendaraan. police_number unik tetapi boleh null (tidak semua kendaraan punya plat).';

-- Riwayat perbaikan (section 5)
create table if not exists public.repair_records (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid not null references public.vehicles(id)
                    on delete cascade on update cascade,
  repair_date     date not null,
  odometer        bigint not null check (odometer >= 0),
  repair_type     text not null,
  complaint       text,
  labor_cost      numeric(14,2) not null default 0 check (labor_cost >= 0),
  additional_cost numeric(14,2) not null default 0 check (additional_cost >= 0),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.repair_records is
  'Satu riwayat perbaikan. parts_cost & total_cost dihitung otomatis (lihat repairs_view).';
comment on column public.repair_records.odometer is
  'Kilometer saat perbaikan. Angka, tidak boleh negatif.';
comment on column public.repair_records.labor_cost is
  'Biaya jasa. Angka (bukan teks Rupiah).';

-- Part yang diganti (section 12-13)
create table if not exists public.repair_parts (
  id         uuid primary key default gen_random_uuid(),
  repair_id  uuid not null references public.repair_records(id)
               on delete cascade on update cascade,
  name       text not null,
  brand      text,
  quantity   int not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  subtotal   numeric(14,2) generated always as (quantity * unit_price) stored,
  notes      text
);

comment on table public.repair_parts is
  'Part yang diganti pada satu riwayat perbaikan. subtotal = quantity * unit_price.';
comment on column public.repair_parts.subtotal is
  'Dihitung otomatis oleh database. Jangan ditulis manual.';

-- Pekerjaan yang dilakukan (section 11, section 26)
create table if not exists public.repair_work (
  id          uuid primary key default gen_random_uuid(),
  repair_id   uuid not null references public.repair_records(id)
                on delete cascade on update cascade,
  description text not null,
  created_at  timestamptz not null default now()
);

comment on table public.repair_work is
  'Pekerjaan yang dilakukan. Berbeda dari part (repair_parts).';

-- =============================================================================
-- Indexes
-- =============================================================================

create index if not exists idx_repair_records_vehicle_date
  on public.repair_records (vehicle_id, repair_date desc);
create index if not exists idx_repair_parts_repair
  on public.repair_parts (repair_id);
create index if not exists idx_repair_work_repair
  on public.repair_work (repair_id);
create index if not exists idx_vehicles_police_number
  on public.vehicles (police_number);

-- =============================================================================
-- updated_at trigger
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_repair_records_updated_at on public.repair_records;
create trigger trg_repair_records_updated_at
  before update on public.repair_records
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Views: biaya dihitung otomatis
-- -----------------------------------------------------------------------------
-- parts_cost  = SUM(subtotal) dari repair_parts
-- total_cost  = parts_cost + labor_cost + additional_cost   (section 14)
-- =============================================================================

create or replace view public.repairs_view as
select
  r.id,
  r.vehicle_id,
  v.user_id,
  r.repair_date,
  r.odometer,
  r.repair_type,
  r.complaint,
  r.labor_cost,
  r.additional_cost,
  r.notes,
  r.created_at,
  r.updated_at,
  coalesce(p.parts_cost, 0)      as parts_cost,
  coalesce(p.parts_count, 0)     as parts_count,
  coalesce(w.work_count, 0)      as work_count,
  coalesce(p.parts_cost, 0) + r.labor_cost + r.additional_cost as total_cost
from public.repair_records r
left join public.vehicles v on v.id = r.vehicle_id
left join (
  select repair_id,
         sum(subtotal) as parts_cost,
         count(*)      as parts_count
  from public.repair_parts
  group by repair_id
) p on p.repair_id = r.id
left join (
  select repair_id,
         count(*) as work_count
  from public.repair_work
  group by repair_id
) w on w.repair_id = r.id;

comment on view public.repairs_view is
  'repair_records + total biaya yang dihitung otomatis. Read-only.';

-- Search view: denormalises vehicle + part names into searchable columns
-- (section 20: cari berdasarkan nama kendaraan, no. polisi, jenis perbaikan,
--  nama part, keluhan, catatan).
-- Dibuat langsung dari repair_records (bukan dari repairs_view) supaya
-- PostgREST tetap bisa mendeteksi relasi ke repair_parts / repair_work.
create or replace view public.repairs_search_view as
select
  r.id,
  r.vehicle_id,
  v.user_id,
  r.repair_date,
  r.odometer,
  r.repair_type,
  r.complaint,
  r.labor_cost,
  r.additional_cost,
  r.notes,
  r.created_at,
  r.updated_at,
  coalesce(p.parts_cost, 0)                        as parts_cost,
  coalesce(p.parts_count, 0)                       as parts_count,
  coalesce(w.work_count, 0)                        as work_count,
  coalesce(p.parts_cost, 0) + r.labor_cost + r.additional_cost as total_cost,
  v.name                                           as vehicle_name,
  v.police_number                                  as police_number,
  p.part_names                                     as part_names
from public.repair_records r
left join public.vehicles v on v.id = r.vehicle_id
left join lateral (
  select sum(subtotal)     as parts_cost,
         count(*)          as parts_count,
         string_agg(distinct name, ', ') as part_names
  from public.repair_parts
  where repair_id = r.id
) p on true
left join lateral (
  select count(*) as work_count
  from public.repair_work
  where repair_id = r.id
) w on true;

comment on view public.repairs_search_view is
  'repair_records + total biaya + nama kendaraan/no polisi/nama part untuk pencarian. Read-only.';

-- Statistik per kendaraan (section 17, section 30)
create or replace view public.vehicle_stats_view as
select
  v.id,
  v.user_id,
  v.name,
  v.brand,
  v.model,
  v.year,
  v.police_number,
  v.current_km,
  v.notes,
  v.created_at,
  v.updated_at,
  coalesce(s.repair_count, 0)   as repair_count,
  coalesce(s.total_spend, 0)    as total_spend,
  s.last_repair_date,
  coalesce(s.last_odometer, v.current_km) as last_odometer
from public.vehicles v
left join (
  select vehicle_id,
         count(*)    as repair_count,
         sum(total_cost) as total_spend,
         max(repair_date) as last_repair_date,
         (array_agg(odometer order by repair_date desc, updated_at desc))[1] as last_odometer
  from public.repairs_view
  group by vehicle_id
) s on s.vehicle_id = v.id;

comment on view public.vehicle_stats_view is
  'Kendaraan + ringkasan riwayat perbaikannya. Read-only.';

-- =============================================================================
-- save_repair(): tulis riwayat perbaikan secara atomik
-- -----------------------------------------------------------------------------
-- Satu riwayat = 1 repair_records + N repair_parts + N repair_work.
-- Dipanggil melalui supabase.rpc('save_repair', { payload }) dari server.
-- =============================================================================

create or replace function public.save_repair(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id            uuid;
  v_vehicle_id    uuid := nullif(payload->>'vehicle_id', '')::uuid;
  v_repair_date   date := (payload->>'repair_date')::date;
  v_odometer      bigint := (payload->>'odometer')::bigint;
  v_repair_type   text := payload->>'repair_type';
  v_complaint     text := nullif(trim(payload->>'complaint'), '');
  v_labor         numeric(14,2) := coalesce(nullif(payload->>'labor_cost', '')::numeric, 0);
  v_additional    numeric(14,2) := coalesce(nullif(payload->>'additional_cost', '')::numeric, 0);
  v_notes         text := nullif(trim(payload->>'notes'), '');
  v_part          jsonb;
  v_work          jsonb;
begin
  -- ---- Validasi dasar (section 25) ---------------------------------------
  if v_vehicle_id is null then
    raise exception 'Kendaraan wajib dipilih';
  end if;
  if v_repair_date is null then
    raise exception 'Tanggal perbaikan wajib diisi';
  end if;
  if v_odometer is null or v_odometer < 0 then
    raise exception 'Kilometer wajib diisi dan tidak boleh negatif';
  end if;
  if v_repair_type is null or btrim(v_repair_type) = '' then
    raise exception 'Jenis perbaikan wajib diisi';
  end if;
  if v_labor < 0 or v_additional < 0 then
    raise exception 'Biaya tidak boleh negatif';
  end if;

  -- ---- Upsert repair_records ---------------------------------------------
  if nullif(payload->>'id', '') is null then
    insert into public.repair_records
      (vehicle_id, repair_date, odometer, repair_type, complaint,
       labor_cost, additional_cost, notes)
    values
      (v_vehicle_id, v_repair_date, v_odometer, v_repair_type, v_complaint,
       v_labor, v_additional, v_notes)
    returning id into v_id;
  else
    v_id := (payload->>'id')::uuid;

    update public.repair_records
    set repair_date     = v_repair_date,
        odometer        = v_odometer,
        repair_type     = v_repair_type,
        complaint       = v_complaint,
        labor_cost      = v_labor,
        additional_cost = v_additional,
        notes           = v_notes
    where id = v_id
      and vehicle_id = v_vehicle_id;

    if not found then
      raise exception 'Riwayat perbaikan tidak ditemukan untuk kendaraan ini';
    end if;

    -- ganti parts & work secara menyeluruh (delete + insert ulang)
    delete from public.repair_parts where repair_id = v_id;
    delete from public.repair_work  where repair_id = v_id;
  end if;

  -- ---- Parts ---------------------------------------------------------------
  -- Iterate over the SET returned by jsonb_array_elements(). FOREACH requires
  -- an array expression, so use a FOR loop instead (jsonb_array_elements is a
  -- set-returning function). `payload->>'parts'` yields text; cast it back to
  -- jsonb (nullif first so a missing key becomes an empty array).
  for v_part in select jsonb_array_elements(coalesce(nullif(payload->>'parts', '')::jsonb, '[]'::jsonb))
  loop
    if btrim(coalesce(v_part->>'name', '')) = '' then
      raise exception 'Nama part wajib diisi';
    end if;
    if coalesce((v_part->>'quantity')::int, 0) <= 0 then
      raise exception 'Jumlah part harus lebih besar dari 0';
    end if;
    if coalesce((v_part->>'unit_price')::numeric, 0) < 0 then
      raise exception 'Harga part tidak boleh negatif';
    end if;

    insert into public.repair_parts
      (repair_id, name, brand, quantity, unit_price, notes)
    values
      (v_id,
       trim(v_part->>'name'),
       nullif(trim(v_part->>'brand'), ''),
       (v_part->>'quantity')::int,
       coalesce(nullif(v_part->>'unit_price', '')::numeric, 0),
       nullif(trim(v_part->>'notes'), ''));
  end loop;

  -- ---- Work ---------------------------------------------------------------
  for v_work in select jsonb_array_elements(coalesce(nullif(payload->>'work', '')::jsonb, '[]'::jsonb))
  loop
    if btrim(coalesce(v_work->>'description', '')) = '' then
      raise exception 'Deskripsi pekerjaan wajib diisi';
    end if;

    insert into public.repair_work (repair_id, description)
    values (v_id, trim(v_work->>'description'));
  end loop;

  -- ---- Sinkronisasi current_km kendaraan ----------------------------------
  -- Riwayat perbaikan adalah catatan historis; KM terakhir yang tercatat
  -- menjadi KM saat ini kendaraan (section 17: "Kilometer terakhir tercatat").
  -- Rule 7: kilometer tidak seharusnya menurun, jadi ambil KM TERTINGGI
  -- (bukan tanggal terbaru) agar menambah catatan lama tidak memundurkan KM.
  update public.vehicles v
  set current_km = (
    select r.odometer
    from public.repair_records r
    where r.vehicle_id = v_vehicle_id
    order by r.odometer desc
    limit 1
  )
  where v.id = v_vehicle_id;

  return v_id;
end;
$$;

-- =============================================================================
-- Row Level Security
-- -----------------------------------------------------------------------------
-- Aplikasi mengakses tabel melalui SERVICE ROLE KEY di server only.
-- Service role melewati RLS, jadi tidak perlu policy.
-- RLS diaktifkan tanpa policy supaya ANON KEY (publik) tidak bisa baca/tulis
-- apa pun. Jangan pernah menaruh service role key di client bundle.
-- =============================================================================

alter table public.vehicles        enable row level security;
alter table public.repair_records  enable row level security;
alter table public.repair_parts    enable row level security;
alter table public.repair_work     enable row level security;

-- =============================================================================
-- Selesai
-- =============================================================================
