-- =====================================================================
-- ATTOS HQ · Avisos de vencimientos (Etapa 6)
--
-- Crea la notificación "Una tarea vence hoy / mañana" para quien tiene la tarea.
-- Se ejecuta sola todos los días a las 08:00 (hora de Argentina) con pg_cron.
--
-- Cómo usarlo (una sola vez):
--   1. Supabase > Database > Extensions: activar "pg_cron" (buscarla y prender el interruptor).
--   2. Pegar este archivo COMPLETO en Supabase > SQL Editor y ejecutarlo.
--   3. Para probarlo al instante, ejecutar aparte:
--        select public.generate_due_soon_notifications();
--      Devuelve cuántas notificaciones creó. Si lo ejecutás de nuevo el mismo día devuelve 0
--      (no repite avisos).
--
-- Para desactivarlo:  select cron.unschedule('avisos-vencimientos');
-- =====================================================================

create or replace function public.generate_due_soon_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz constant text := 'America/Argentina/Buenos_Aires';
  v_today date := (now() at time zone v_tz)::date;
  v_start_of_today timestamptz := (v_today::timestamp) at time zone v_tz;
  v_count integer;
begin
  with due as (
    select t.id, t.title, t.assignee_id, t.due_date
    from public.tasks t
    where t.assignee_id is not null
      and t.parent_task_id is null
      and t.status <> 'listo'
      and t.due_date between v_today and v_today + 1
  ),
  created as (
    insert into public.notifications (user_id, type, entity_type, entity_id, message)
    select
      d.assignee_id,
      'vence_pronto'::public.notification_type,
      'task'::public.entity_type,
      d.id,
      case
        when d.due_date = v_today then 'Una tarea vence hoy: ' || d.title || '.'
        else 'Una tarea vence mañana: ' || d.title || '.'
      end
    from due d
    where not exists (
      -- No repetir: si ya se avisó hoy de esta tarea a esta persona, se saltea.
      select 1
      from public.notifications n
      where n.user_id = d.assignee_id
        and n.type = 'vence_pronto'
        and n.entity_type = 'task'
        and n.entity_id = d.id
        and n.created_at >= v_start_of_today
    )
    returning 1
  )
  select count(*) into v_count from created;

  return v_count;
end
$$;

-- Solo la puede ejecutar el sistema (pg_cron) o quien administra la base; no las personas logueadas desde la app.
revoke all on function public.generate_due_soon_notifications() from public, anon, authenticated;

-- Programación diaria: 11:00 UTC = 08:00 en Argentina (que no usa horario de verano).
select cron.schedule(
  'avisos-vencimientos',
  '0 11 * * *',
  $cron$select public.generate_due_soon_notifications();$cron$
);
