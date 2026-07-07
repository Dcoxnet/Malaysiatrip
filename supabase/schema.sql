create table if not exists public.checklist_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  checked jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.checklist_progress enable row level security;

drop policy if exists "Users can read own checklist progress" on public.checklist_progress;
create policy "Users can read own checklist progress"
on public.checklist_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own checklist progress" on public.checklist_progress;
create policy "Users can insert own checklist progress"
on public.checklist_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own checklist progress" on public.checklist_progress;
create policy "Users can update own checklist progress"
on public.checklist_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists checklist_progress_set_updated_at on public.checklist_progress;
create trigger checklist_progress_set_updated_at
before update on public.checklist_progress
for each row
execute function public.set_updated_at();
