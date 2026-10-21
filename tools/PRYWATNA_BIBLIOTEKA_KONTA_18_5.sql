-- STUDYLAB 18.5: separate PRIVATE PDFs and drafts for EVERY authenticated account.
-- Run once in Supabase SQL Editor, in the existing StudyLab Supabase project.
-- This replaces version 18.4's single-admin restriction. NO user UUID or secrets needed.
-- All files live under authenticated UID folders: <uid>/<uuid>.pdf,
-- <uid>/<uuid>.json, <uid>/drafts/<uuid>.json.
-- Never configure this bucket as public.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('studylab-private-books','studylab-private-books',false,52428800,
       array['application/pdf','application/json']::text[])
on conflict(id) do update set public=false,file_size_limit=52428800,
 allowed_mime_types=array['application/pdf','application/json']::text[];

-- Remove ONLY the known StudyLab 18.4 policies, which restricted access to the administrator.
drop policy if exists "studylab_books_private_read" on storage.objects;
drop policy if exists "studylab_books_private_insert" on storage.objects;
drop policy if exists "studylab_books_private_delete" on storage.objects;

-- Reading is limited to authenticated owner's folder AND Storage's owner_id.
-- Explicitly exclude anonymous sessions. Signed URLs must not be publicly issued.
drop policy if exists "studylab_185_self_select" on storage.objects;
create policy "studylab_185_self_select" on storage.objects
for select to authenticated using(
  bucket_id='studylab-private-books'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and owner_id=(select auth.uid()::text)
);

drop policy if exists "studylab_185_self_insert" on storage.objects;
create policy "studylab_185_self_insert" on storage.objects
for insert to authenticated with check(
  bucket_id='studylab-private-books'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and owner_id=(select auth.uid()::text)
);

-- Allow replacing only your OWN draft JSON files. PDF files are never overwritten by UI.
drop policy if exists "studylab_185_self_update" on storage.objects;
create policy "studylab_185_self_update" on storage.objects
for update to authenticated using(
  bucket_id='studylab-private-books'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and owner_id=(select auth.uid()::text)
  and name like (select auth.uid()::text)||'/drafts/%.json'
) with check(
  bucket_id='studylab-private-books'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and owner_id=(select auth.uid()::text)
  and name like (select auth.uid()::text)||'/drafts/%.json'
);

drop policy if exists "studylab_185_self_delete" on storage.objects;
create policy "studylab_185_self_delete" on storage.objects
for delete to authenticated using(
  bucket_id='studylab-private-books'
  and (select auth.uid()) is not null
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and owner_id=(select auth.uid()::text)
);

-- SECURITY NOTE: PostgreSQL combines PERMISSIVE RLS policies with OR.
-- Review Storage > Policies for this bucket. Remove any older custom broad policy
-- granting anonymous or cross-account access. Do NOT grant service_role to browsers.
-- Existing uploaded PDFs remain in the original owner's folder.
