-- StudyLab 18.4 / uruchom w Supabase Dashboard -> SQL Editor.
-- OBOWIĄZKOWO: zamień wszystkie wystąpienia __YOUR_SUPABASE_UID__ na UUID swojego konta.
-- NIE dodawaj tej wersji SQL (ze swoim UUID) do publicznego repozytorium.
-- Konto będzie mieć dostęp tylko do prywatnego bucketu; żadne inne konto nie uzyska dostępu.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studylab-private-books', 'studylab-private-books', false, 52428800,
        array['application/pdf','application/json']::text[])
on conflict (id) do update set public=false,
 file_size_limit=52428800,
 allowed_mime_types=array['application/pdf','application/json']::text[];

create or replace function public.studylab_is_books_owner()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) = '__YOUR_SUPABASE_UID__'::uuid;
$$;
revoke all on function public.studylab_is_books_owner() from public, anon;
grant execute on function public.studylab_is_books_owner() to authenticated;

-- Weryfikacja UID po stronie Supabase + ograniczenie do folderu UID.
-- Usunięcie i odczyt wymagają właściciela również przy bezpośrednim żądaniu HTTP.
drop policy if exists "studylab_books_private_read" on storage.objects;
create policy "studylab_books_private_read" on storage.objects
for select to authenticated
using (
  bucket_id='studylab-private-books'
  and (select public.studylab_is_books_owner())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "studylab_books_private_insert" on storage.objects;
create policy "studylab_books_private_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id='studylab-private-books'
  and (select public.studylab_is_books_owner())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "studylab_books_private_delete" on storage.objects;
create policy "studylab_books_private_delete" on storage.objects
for delete to authenticated
using (
  bucket_id='studylab-private-books'
  and (select public.studylab_is_books_owner())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);

-- Nie nadawajemy publicznych polityk dostępu, aktualizacji ani upsert.
-- Jeżeli już wcześniej dodałeś inne (zbyt szerokie) polityki dla tego bucketu,
-- sprawdź je ręcznie: polityki RLS łączą się operatorem OR.
