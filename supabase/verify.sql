select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('clients', 'metrics');

select tablename, policyname from pg_policies
where schemaname = 'public' and tablename in ('clients', 'metrics');
