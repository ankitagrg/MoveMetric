select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('clients', 'metrics');

select tablename, policyname from pg_policies
where schemaname = 'public' and tablename in ('clients', 'metrics');

-- Video storage: confirms the bucket exists, the metrics table has
-- somewhere to point to it, and all three storage.objects policies made it.
select id, public from storage.buckets where id = 'capture-videos';

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'metrics' and column_name = 'video_path';

select policyname from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like '%capture videos%';
