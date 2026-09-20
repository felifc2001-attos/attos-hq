-- =====================================================================
-- ATTOS HQ · Esquema inicial de la base de datos (Etapa 0B)
--
-- Cómo usarlo: pegarlo COMPLETO en Supabase > SQL Editor y ejecutarlo UNA vez.
-- Corre dentro de una transacción: si algo falla, no queda nada a medias
-- y se puede volver a ejecutar después de corregir el error.
--
-- Convenciones:
--   * Tablas y columnas en inglés (como en la especificación); valores de
--     estados/prioridades en español sin acentos (por_hacer, en_curso, etc.).
--   * "users" de la especificación = tabla `profiles`, ligada a la
--     autenticación de Supabase (auth.users).
--   * comments, attachments, notifications y activities son "genéricas":
--     apuntan a cualquier cosa con (entity_type, entity_id).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tipos (listas de valores permitidos)
-- ---------------------------------------------------------------------

create type public.work_area as enum ('comercial', 'operaciones', 'marketing', 'sistemas');
create type public.priority_level as enum ('baja', 'media', 'alta', 'urgente');
create type public.task_status as enum ('por_hacer', 'en_curso', 'para_revisar', 'listo');
create type public.project_status as enum ('idea', 'planificando', 'en_curso', 'pausado', 'finalizado');
create type public.content_format as enum ('reel', 'historia', 'post', 'campana', 'publicidad', 'otro');
create type public.content_status as enum ('ideas', 'produccion', 'diseno', 'para_aprobar', 'programado', 'publicado');
create type public.review_status as enum ('pendiente', 'aprobado', 'cambios_solicitados');
create type public.issue_category as enum ('bug', 'mejora', 'nueva_funcionalidad', 'mantenimiento', 'idea_tecnica');
create type public.issue_status as enum ('reportado', 'por_revisar', 'en_desarrollo', 'testing', 'produccion');
create type public.dependency_status as enum ('pendiente', 'entregado');
create type public.event_category as enum ('comercial', 'marketing', 'sistemas', 'operaciones', 'reuniones');
create type public.event_kind as enum ('reunion', 'campana', 'lanzamiento', 'evento', 'fecha_comercial', 'deadline', 'otro');
create type public.entity_type as enum ('task', 'project', 'idea', 'content_item', 'system_issue', 'calendar_event', 'dependency');
create type public.notification_type as enum (
  'asignacion', 'comentario', 'pedido_nuevo', 'pedido_entregado',
  'aprobacion_solicitada', 'aprobacion_resuelta', 'vence_pronto', 'problema_resuelto'
);
create type public.activity_action as enum (
  'creo', 'actualizo', 'movio', 'completo', 'comento', 'aprobo', 'solicito_cambios', 'entrego'
);

-- ---------------------------------------------------------------------
-- 2. Personas
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null,
  area text,                              -- texto que se muestra, ej. "Comercial & Operaciones"
  default_area public.work_area,          -- área que se sugiere al crear tareas
  color text not null default '#631636',  -- color identificador
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Etiquetas y proyectos
-- ---------------------------------------------------------------------

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6f6470',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references public.profiles (id) on delete set null,
  start_date date,
  target_date date,
  status public.project_status not null default 'idea',
  progress_override smallint check (progress_override between 0 and 100), -- vacío = se calcula solo
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (project_id, user_id)
);

-- ---------------------------------------------------------------------
-- 4. Tareas
-- ---------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  creator_id uuid references public.profiles (id) on delete set null,
  area public.work_area,
  project_id uuid references public.projects (id) on delete set null,
  parent_task_id uuid references public.tasks (id) on delete cascade, -- si tiene valor, es una subtarea
  due_date date,
  priority public.priority_level not null default 'media',
  status public.task_status not null default 'por_hacer',
  position double precision not null default (extract(epoch from clock_timestamp())::double precision), -- orden en el Kanban
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_task_id is distinct from id)
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  text text not null,
  is_done boolean not null default false,
  position double precision not null default (extract(epoch from clock_timestamp())::double precision),
  created_at timestamptz not null default now()
);

create table public.task_labels (
  task_id uuid not null references public.tasks (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (task_id, label_id)
);

-- ---------------------------------------------------------------------
-- 5. Ideas
-- ---------------------------------------------------------------------

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid references public.profiles (id) on delete set null,
  area public.work_area,
  converted_task_id uuid references public.tasks (id) on delete set null,
  converted_project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_votes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table public.idea_labels (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (idea_id, label_id)
);

-- ---------------------------------------------------------------------
-- 6. Contenido (pipeline de marketing)
-- ---------------------------------------------------------------------

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  idea_id uuid references public.ideas (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  format public.content_format not null default 'post',
  status public.content_status not null default 'ideas',
  assignee_id uuid references public.profiles (id) on delete set null,
  creator_id uuid references public.profiles (id) on delete set null,
  publish_at timestamptz,
  copy text,
  links text[] not null default '{}',
  review_status public.review_status not null default 'pendiente',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  position double precision not null default (extract(epoch from clock_timestamp())::double precision),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. Sistemas (problemas y mejoras del sistema de pedidos)
-- ---------------------------------------------------------------------

create table public.system_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category public.issue_category not null default 'bug',
  priority public.priority_level not null default 'media',
  status public.issue_status not null default 'reportado',
  reporter_id uuid references public.profiles (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null, -- vacío = bandeja de Sistemas
  steps_to_reproduce text,
  position double precision not null default (extract(epoch from clock_timestamp())::double precision),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Calendario (eventos propios; las tareas con fecha y el contenido
--    programado se muestran en el calendario desde sus propias tablas)
-- ---------------------------------------------------------------------

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category public.event_category not null,
  kind public.event_kind not null default 'evento',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  project_id uuid references public.projects (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

-- ---------------------------------------------------------------------
-- 9. "Necesito de…" (dependencias entre personas)
-- ---------------------------------------------------------------------

create table public.dependencies (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade, -- quien necesita
  provider_id uuid not null references public.profiles (id) on delete cascade,  -- de quien lo necesita
  title text not null,
  description text,
  due_date date,
  status public.dependency_status not null default 'pendiente',
  delivered_at timestamptz,
  task_id uuid references public.tasks (id) on delete set null,       -- tarea que queda bloqueada mientras esté pendiente
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> provider_id)
);

-- ---------------------------------------------------------------------
-- 10. Tablas genéricas: comentarios, adjuntos, notificaciones, actividad
-- ---------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  file_name text not null,
  storage_path text not null unique, -- ruta dentro del bucket "attachments"
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade, -- quien la recibe
  actor_id uuid references public.profiles (id) on delete set null,        -- quien la provocó
  type public.notification_type not null,
  entity_type public.entity_type,
  entity_id uuid,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action public.activity_action not null,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  entity_title text not null, -- se guarda el título para poder mostrar la frase aunque el elemento se borre
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11. Índices (para que las pantallas carguen rápido)
-- ---------------------------------------------------------------------

create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_parent_idx on public.tasks (parent_task_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);
create index task_checklist_items_task_idx on public.task_checklist_items (task_id);
create index task_labels_label_idx on public.task_labels (label_id);
create index idea_labels_label_idx on public.idea_labels (label_id);
create index ideas_creator_idx on public.ideas (creator_id);
create index content_items_status_idx on public.content_items (status);
create index content_items_publish_idx on public.content_items (publish_at);
create index system_issues_status_idx on public.system_issues (status);
create index calendar_events_starts_idx on public.calendar_events (starts_at);
create index dependencies_provider_idx on public.dependencies (provider_id, status);
create index dependencies_requester_idx on public.dependencies (requester_id, status);
create index dependencies_task_idx on public.dependencies (task_id);
create index comments_entity_idx on public.comments (entity_type, entity_id, created_at);
create index attachments_entity_idx on public.attachments (entity_type, entity_id);
create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index activities_created_idx on public.activities (created_at desc);
create index project_members_user_idx on public.project_members (user_id);

-- ---------------------------------------------------------------------
-- 12. Automatismos (triggers)
-- ---------------------------------------------------------------------

-- 12.1 Mantener updated_at al día
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'projects', 'tasks', 'ideas', 'content_items',
    'system_issues', 'calendar_events', 'dependencies', 'comments'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end $$;

-- 12.2 Fechas de cierre: se completan solas al pasar al estado final
create function public.set_task_completed_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'listo' then
    if tg_op = 'INSERT' then
      new.completed_at := coalesce(new.completed_at, now());
    elsif old.status is distinct from 'listo' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger tasks_completed_at before insert or update of status on public.tasks
  for each row execute function public.set_task_completed_at();

create function public.set_issue_resolved_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'produccion' then
    if tg_op = 'INSERT' then
      new.resolved_at := coalesce(new.resolved_at, now());
    elsif old.status is distinct from 'produccion' then
      new.resolved_at := now();
    end if;
  else
    new.resolved_at := null;
  end if;
  return new;
end $$;

create trigger system_issues_resolved_at before insert or update of status on public.system_issues
  for each row execute function public.set_issue_resolved_at();

create function public.set_dependency_delivered_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'entregado' then
    if tg_op = 'INSERT' then
      new.delivered_at := coalesce(new.delivered_at, now());
    elsif old.status is distinct from 'entregado' then
      new.delivered_at := now();
    end if;
  else
    new.delivered_at := null;
  end if;
  return new;
end $$;

create trigger dependencies_delivered_at before insert or update of status on public.dependencies
  for each row execute function public.set_dependency_delivered_at();

-- 12.3 Al borrar una tarea/idea/etc., se borran sus comentarios, adjuntos y
--      notificaciones (como son genéricos, la base no lo hace sola).
--      La actividad (historial) se conserva a propósito.
create function public.delete_entity_children() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_type public.entity_type := tg_argv[0]::public.entity_type;
begin
  delete from public.comments where entity_type = v_type and entity_id = old.id;
  delete from public.attachments where entity_type = v_type and entity_id = old.id;
  delete from public.notifications where entity_type = v_type and entity_id = old.id;
  return old;
end $$;

create trigger tasks_cleanup after delete on public.tasks
  for each row execute function public.delete_entity_children('task');
create trigger projects_cleanup after delete on public.projects
  for each row execute function public.delete_entity_children('project');
create trigger ideas_cleanup after delete on public.ideas
  for each row execute function public.delete_entity_children('idea');
create trigger content_items_cleanup after delete on public.content_items
  for each row execute function public.delete_entity_children('content_item');
create trigger system_issues_cleanup after delete on public.system_issues
  for each row execute function public.delete_entity_children('system_issue');
create trigger calendar_events_cleanup after delete on public.calendar_events
  for each row execute function public.delete_entity_children('calendar_event');
create trigger dependencies_cleanup after delete on public.dependencies
  for each row execute function public.delete_entity_children('dependency');

-- 12.4 Cuando se crea una cuenta en Supabase, se crea su perfil automáticamente
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', initcap(split_part(new.email, '@', 1)))
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si ya existían cuentas antes de correr este archivo, les crea el perfil ahora
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', initcap(split_part(u.email, '@', 1)))
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 13. Vistas (cálculos listos para usar)
-- ---------------------------------------------------------------------

-- Proyectos con su progreso: automático (tareas listas / tareas totales,
-- sin contar subtareas) salvo que se haya fijado uno manual.
create view public.projects_with_progress with (security_invoker = true) as
select
  p.*,
  count(t.id)::int as task_count,
  (count(t.id) filter (where t.status = 'listo'))::int as done_count,
  coalesce(
    p.progress_override::int,
    case
      when count(t.id) = 0 then 0
      else round(100.0 * count(t.id) filter (where t.status = 'listo') / count(t.id))::int
    end
  ) as progress
from public.projects p
left join public.tasks t on t.project_id = p.id and t.parent_task_id is null
group by p.id;

-- Tareas bloqueadas: las que esperan un "Necesito de…" todavía pendiente
create view public.blocked_tasks with (security_invoker = true) as
select distinct task_id
from public.dependencies
where status = 'pendiente' and task_id is not null;

-- ---------------------------------------------------------------------
-- 14. Seguridad (Row Level Security)
--     Regla general: solo pueden entrar personas con cuenta (logueadas).
--     Dentro del equipo todos ven todo; lo personal (notificaciones,
--     perfil propio, comentarios propios) solo lo modifica su dueño.
-- ---------------------------------------------------------------------

-- La gente sin sesión no puede tocar ninguna tabla
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- Tablas donde cualquier persona del equipo puede leer y escribir
do $$
declare t text;
begin
  foreach t in array array[
    'labels', 'projects', 'project_members', 'tasks', 'task_checklist_items',
    'task_labels', 'ideas', 'idea_labels', 'content_items', 'system_issues',
    'calendar_events', 'dependencies', 'attachments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "team_full_access" on public.%I for all to authenticated
         using ((select auth.uid()) is not null)
         with check ((select auth.uid()) is not null)', t
    );
  end loop;
end $$;

-- Perfiles: todos ven a todos; cada persona edita solo el suyo
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles for select to authenticated
  using ((select auth.uid()) is not null);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Comentarios: todos leen y comentan; cada persona edita/borra los suyos
alter table public.comments enable row level security;
create policy "comments_read" on public.comments for select to authenticated
  using ((select auth.uid()) is not null);
create policy "comments_insert_own" on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "comments_update_own" on public.comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "comments_delete_own" on public.comments for delete to authenticated
  using (author_id = (select auth.uid()));

-- Notificaciones: cada persona ve y gestiona las suyas; cualquiera puede avisar a otro
alter table public.notifications enable row level security;
create policy "notifications_read_own" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications_delete_own" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications_insert_team" on public.notifications for insert to authenticated
  with check ((select auth.uid()) is not null);

-- Actividad: todos leen; cada persona registra solo sus propias acciones; no se edita ni se borra
alter table public.activities enable row level security;
create policy "activities_read" on public.activities for select to authenticated
  using ((select auth.uid()) is not null);
create policy "activities_insert_own" on public.activities for insert to authenticated
  with check (actor_id = (select auth.uid()));

-- Votos de ideas: todos los ven; cada persona pone y saca solo su voto
alter table public.idea_votes enable row level security;
create policy "idea_votes_read" on public.idea_votes for select to authenticated
  using ((select auth.uid()) is not null);
create policy "idea_votes_insert_own" on public.idea_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "idea_votes_delete_own" on public.idea_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 15. Almacenamiento de archivos (capturas, imágenes, videos, adjuntos)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_bucket_read" on storage.objects for select to authenticated
  using (bucket_id = 'attachments');
create policy "attachments_bucket_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');
create policy "attachments_bucket_update" on storage.objects for update to authenticated
  using (bucket_id = 'attachments') with check (bucket_id = 'attachments');
create policy "attachments_bucket_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments');

-- ---------------------------------------------------------------------
-- 16. Tiempo real (para que los cambios lleguen sin recargar la página)
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.tasks, public.task_checklist_items, public.projects, public.ideas,
      public.idea_votes, public.content_items, public.system_issues,
      public.calendar_events, public.dependencies, public.comments,
      public.notifications, public.activities;
  end if;
end $$;

commit;
