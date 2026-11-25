-- Catálogo del esquema para scripts/schema-check.sh: una fila por objeto, sin depender del orden de las columnas.
SELECT 'col|'||c.relname||'|'||a.attname||'|'||format_type(a.atttypid,a.atttypmod)||'|nn='||a.attnotnull||'|def='||coalesce(pg_get_expr(d.adbin,d.adrelid),'')
  FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped AND c.relname<>'migrations'
UNION ALL
SELECT 'con|'||c.relname||'|'||co.conname||'|'||pg_get_constraintdef(co.oid)
  FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname<>'migrations'
UNION ALL
SELECT 'idx|'||regexp_replace(indexdef,'\s+',' ','g') FROM pg_indexes WHERE schemaname='public' AND tablename<>'migrations'
UNION ALL
SELECT 'trg|'||pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal
UNION ALL
SELECT 'fn|'||p.proname||'|'||pg_get_function_identity_arguments(p.oid)||'|'||md5(regexp_replace(regexp_replace(p.prosrc,'--[^\n]*','','g'),'\s+',' ','g'))
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
UNION ALL
SELECT 'view|'||c.relname||'|'||coalesce(array_to_string(c.reloptions,','),'')||'|'||md5(regexp_replace(pg_get_viewdef(c.oid),'\s+',' ','g'))
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m')
UNION ALL
SELECT 'pol|'||tablename||'|'||policyname||'|'||cmd||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') FROM pg_policies WHERE schemaname='public'
UNION ALL
SELECT 'rls|'||c.relname||'|'||c.relrowsecurity||'|'||c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname<>'migrations'
UNION ALL
SELECT 'seq|'||c.relname||'|'||coalesce((SELECT d.refobjid::regclass::text||'.'||a.attname FROM pg_depend d JOIN pg_attribute a ON a.attrelid=d.refobjid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.deptype='a' LIMIT 1),'')
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S'
UNION ALL
SELECT 'ext|'||extname FROM pg_extension
ORDER BY 1;
