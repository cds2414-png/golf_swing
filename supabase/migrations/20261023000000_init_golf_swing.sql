-- golf-swing-checking 프로젝트(hrbabpjsbinbbbhzviua)에 적용된 스키마 기록

-- 회원 프로필
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  birth_year int check (birth_year between 1900 and 2100),
  gender text check (gender in ('male', 'female', 'other')),
  handedness text not null default 'right' check (handedness in ('right', 'left')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필 조회" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "본인 프로필 수정" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 가입 시 메타데이터로 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, birth_year, gender, handedness)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_year', '')::int,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'handedness', ''), 'right')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 스윙 분석 요청 (결제 정보 포함)
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_type text not null check (club_type in ('driver', 'wood', 'hybrid', 'iron', 'wedge', 'putter')),
  video_path text not null,
  frame_paths text[] not null default '{}',
  video_duration numeric(4,2),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'analyzing', 'completed', 'failed')),
  amount int not null check (amount > 0),
  order_id text not null unique,
  payment_key text,
  paid_at timestamptz,
  age_at_analysis int,
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index analyses_user_id_created_at_idx on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

-- 쓰기는 서버(service role)에서만 수행. 사용자는 본인 것만 조회.
create policy "본인 분석 조회" on public.analyses
  for select to authenticated using ((select auth.uid()) = user_id);

-- 스윙 영상·프레임 저장소 (비공개, 50MB 제한)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('swing-videos', 'swing-videos', false, 52428800,
        array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg']);

create policy "본인 폴더 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'swing-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "본인 폴더 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'swing-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
