-- =====================================================================
-- ATTOS HQ · Búsqueda, preferencias de notificaciones y tiempo real (Etapa 9)
--
-- Qué hace:
--   1. Búsqueda global: la función public.search_all() busca en tareas, proyectos, ideas,
--      contenido, problemas de Sistemas y comentarios, sin distinguir mayúsculas ni tildes
--      ("reunion" encuentra "Reunión") y con varias palabras en cualquier orden.
--      Respeta los permisos: la ejecuta cada persona con su sesión.
--   2. Preferencias de notificaciones: cada persona puede silenciar tipos de aviso
--      (profiles.muted_notification_types). Un disparador descarta los avisos silenciados
--      al crearlos, así también se respeta en los avisos automáticos de vencimientos.
--   3. Tiempo real: se asegura que todas las tablas que la app escucha estén publicadas
--      en supabase_realtime (las que ya estaban se saltean).
--
-- Cómo usarlo (una sola vez): pegarlo COMPLETO en Supabase > SQL Editor y ejecutarlo.
-- Se puede volver a ejecutar sin problema.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Búsqueda global
-- ---------------------------------------------------------------------

create extension if not exists unaccent with schema extensions;

-- Texto en minúsculas y sin tildes, para comparar.
-- (Se pasa el diccionario con su esquema para que funcione con search_path vacío.)
create or replace function public.norm_text(p_text text)
returns text
language sql
stable
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, lower(coalesce(p_text, '')))
$$;

-- Busca `p_query` (cada palabra tiene que aparecer, en cualquier orden) y devuelve hasta `p_limit`
-- resultados por tipo, primero los que la tienen en el título y después los más recientes.
--   kind:      task | project | idea | content_item | system_issue | comment
--   detail:    el texto donde se encontró (descripción, copy, comentario…)
--   ref_type / ref_id: solo en comentarios, el elemento del que cuelgan (con su título en `title`)
create or replace function public.search_all(p_query text, p_limit integer default 8)
returns table (
  kind text,
  item_id uuid,
  title text,
  detail text,
  status text,
  in_title boolean,
  ref_type text,
  ref_id uuid,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select array_agg(
             '%' || replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_') || '%'
           ) as pats
    from (
      select term
      from unnest(regexp_split_to_array(trim(public.norm_text(p_query)), '\s+')) as term
      where term <> '' and length(trim(p_query)) >= 2
      limit 6
    ) terms
  )
  (select 'task'::text, t.id, t.title, t.description, t.status::text,
          public.norm_text(t.title) like all (q.pats),
          null::text, null::uuid, t.updated_at
   from public.tasks t, q
   where public.norm_text(concat_ws(' ', t.title, t.description)) like all (q.pats)
   order by 6 desc, t.updated_at desc
   limit greatest(p_limit, 1))
  union all
  (select 'project'::text, p.id, p.name, p.description, p.status::text,
          public.norm_text(p.name) like all (q.pats),
          null::text, null::uuid, p.updated_at
   from public.projects p, q
   where public.norm_text(concat_ws(' ', p.name, p.description)) like all (q.pats)
   order by 6 desc, p.updated_at desc
   limit greatest(p_limit, 1))
  union all
  (select 'idea'::text, i.id, i.title, i.description, null::text,
          public.norm_text(i.title) like all (q.pats),
          null::text, null::uuid, i.updated_at
   from public.ideas i, q
   where public.norm_text(concat_ws(' ', i.title, i.description)) like all (q.pats)
   order by 6 desc, i.updated_at desc
   limit greatest(p_limit, 1))
  union all
  (select 'content_item'::text, c.id, c.title, c.copy, c.status::text,
          public.norm_text(c.title) like all (q.pats),
          null::text, null::uuid, c.updated_at
   from public.content_items c, q
   where public.norm_text(concat_ws(' ', c.title, c.copy)) like all (q.pats)
   order by 6 desc, c.updated_at desc
   limit greatest(p_limit, 1))
  union all
  (select 'system_issue'::text, s.id, s.title, concat_ws(E'\n', s.description, s.steps_to_reproduce), s.status::text,
          public.norm_text(s.title) like all (q.pats),
          null::text, null::uuid, s.updated_at
   from public.system_issues s, q
   where public.norm_text(concat_ws(' ', s.title, s.description, s.steps_to_reproduce)) like all (q.pats)
   order by 6 desc, s.updated_at desc
   limit greatest(p_limit, 1))
  union all
  (select 'comment'::text, m.id,
          coalesce(
            case m.entity_type::text
              when 'task' then (select x.title from public.tasks x where x.id = m.entity_id)
              when 'project' then (select x.name from public.projects x where x.id = m.entity_id)
              when 'idea' then (select x.title from public.ideas x where x.id = m.entity_id)
              when 'content_item' then (select x.title from public.content_items x where x.id = m.entity_id)
              when 'system_issue' then (select x.title from public.system_issues x where x.id = m.entity_id)
              when 'dependency' then (select x.title from public.dependencies x where x.id = m.entity_id)
              when 'calendar_event' then (select x.title from public.calendar_events x where x.id = m.entity_id)
            end,
            ''
          ),
          m.body, null::text, false,
          m.entity_type::text, m.entity_id, m.updated_at
   from public.comments m, q
   where public.norm_text(m.body) like all (q.pats)
   order by m.updated_at desc
   limit greatest(p_limit, 1))
$$;

-- Solo las personas con sesión (no el público) pueden buscar.
revoke all on function public.search_all(text, integer) from public, anon;
grant execute on function public.search_all(text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Preferencias de notificaciones
-- ---------------------------------------------------------------------

-- Los tipos de aviso que cada persona silenció. Vacío = recibe todos.
-- (Cada persona edita solo su perfil: ya lo exige la política "profiles_update_own".)
alter table public.profiles
  add column if not exists muted_notification_types public.notification_type[] not null default '{}';

create or replace function public.skip_muted_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Si quien la recibe silenció este tipo, la notificación simplemente no se crea.
  if exists (
    select 1
    from public.profiles p
    where p.id = new.user_id
      and new.type = any (p.muted_notification_types)
  ) then
    return null;
  end if;
  return new;
end
$$;

drop trigger if exists notifications_skip_muted on public.notifications;
create trigger notifications_skip_muted
  before insert on public.notifications
  for each row execute function public.skip_muted_notifications();

-- ---------------------------------------------------------------------
-- 3. Tiempo real: que todo lo que la app escucha esté publicado
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'tasks', 'task_checklist_items', 'projects', 'project_members', 'ideas', 'idea_votes',
      'content_items', 'system_issues', 'calendar_events', 'dependencies', 'comments',
      'notifications', 'activities', 'profiles'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;

commit;
