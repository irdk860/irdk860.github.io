-- Book Reader account storage (Supabase project "book-reader").
-- Every row and file belongs to one account; row-level security stops anyone else reading or changing it.

-- One row per book on a person's shelf.
create table public.library (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_key text not null check (char_length(book_key) between 1 and 64),
  title text not null default '' check (char_length(title) <= 500),
  pos integer not null default 0,
  pct real not null default 0,
  bookmarks jsonb not null default '[]'::jsonb,
  tr text,
  blang text,
  opened bigint not null default 0,
  saved bigint not null default 0,          -- when the reading record last changed (ms)
  has_text boolean not null default false,  -- book text uploaded to storage
  has_cover boolean not null default false,
  deleted boolean not null default false,   -- removed from the shelf
  data jsonb not null default '{}'::jsonb,  -- the full reading record as the app keeps it
  cover_at bigint not null default 0,       -- when the picture last changed (ms)
  primary key (user_id, book_key),
  constraint library_data_size check (pg_column_size(data) < 200000)
);
alter table public.library enable row level security;
create policy "read own books" on public.library for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own books" on public.library for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own books" on public.library for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own books" on public.library for delete to authenticated using ((select auth.uid()) = user_id);

-- One row per person: appearance, text size, reading speed and app language.
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  saved bigint not null default 0
);
alter table public.settings enable row level security;
create policy "read own settings" on public.settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own settings" on public.settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own settings" on public.settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- If a device sends an older record than the one saved, keep the newer one.
create or replace function public.keep_newest()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.saved < old.saved then
    new.saved := old.saved;
    new.data := old.data;
    if tg_table_name = 'library' then
      new.title := old.title; new.pos := old.pos; new.pct := old.pct; new.bookmarks := old.bookmarks;
      new.opened := old.opened; new.deleted := old.deleted; new.tr := old.tr; new.blang := old.blang;
    end if;
  end if;
  if tg_table_name = 'library' then
    if new.cover_at < old.cover_at then
      new.cover_at := old.cover_at; new.has_cover := old.has_cover;
    end if;
  end if;
  return new;
end $$;
create trigger library_keep_newest before update on public.library for each row execute function public.keep_newest();
create trigger settings_keep_newest before update on public.settings for each row execute function public.keep_newest();
revoke execute on function public.keep_newest() from public, anon, authenticated;

-- Private files: {account id}/{book}.book (gzipped text) and {account id}/{book}.jpg (cover).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('books', 'books', false, 26214400, array['application/json','application/gzip','application/octet-stream','image/jpeg'])
on conflict (id) do nothing;
create policy "read own book files" on storage.objects for select to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "add own book files" on storage.objects for insert to authenticated
  with check (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "update own book files" on storage.objects for update to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own book files" on storage.objects for delete to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
