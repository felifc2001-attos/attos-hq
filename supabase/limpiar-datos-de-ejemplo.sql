-- =====================================================================
-- ATTOS HQ · Limpiar los datos de ejemplo (para empezar con datos reales)
--
-- CUÁNDO USARLO: una sola vez, cuando el equipo ya probó todo y quiere empezar a cargar
-- lo de verdad. Mientras tanto, los datos de ejemplo sirven para probar.
--
-- QUÉ BORRA (todo el contenido de trabajo):
--   tareas, subtareas y checklists · proyectos y sus integrantes · ideas y votos · contenido ·
--   problemas de Sistemas · eventos del calendario · pedidos "Necesito de…" ·
--   comentarios · adjuntos · notificaciones · historial de actividad
--
-- QUÉ NO TOCA:
--   las cuentas y los perfiles de las personas (nombre, color, contraseña, preferencias),
--   y las etiquetas (todavía no se pueden crear desde la app).
--
-- NO SE PUEDE DESHACER. Si tenés dudas, antes hacé una copia: Supabase > Database > Backups
-- (solo en el plan Pro) o pedime que te prepare una exportación.
--
-- CÓMO USARLO (dos pasos, para no borrar por accidente):
--   1. Ejecutá este archivo tal cual: solo CUENTA lo que hay (no borra nada).
--   2. Si el resultado es lo que esperás: borrá las dos líneas que dicen "BORRAR DESDE ACÁ" y
--      "BORRAR HASTA ACÁ" (son el comienzo y el final de un comentario) y volvé a ejecutarlo.
-- =====================================================================

-- Paso 1: cuánto hay hoy
select 'tareas' as que, count(*) as cantidad from public.tasks
union all select 'proyectos', count(*) from public.projects
union all select 'ideas', count(*) from public.ideas
union all select 'contenido', count(*) from public.content_items
union all select 'problemas de Sistemas', count(*) from public.system_issues
union all select 'eventos del calendario', count(*) from public.calendar_events
union all select 'pedidos "Necesito de…"', count(*) from public.dependencies
union all select 'comentarios', count(*) from public.comments
union all select 'notificaciones', count(*) from public.notifications
union all select 'historial de actividad', count(*) from public.activities
union all select 'personas (NO se borran)', count(*) from public.profiles
union all select 'etiquetas (NO se borran)', count(*) from public.labels;

/* BORRAR DESDE ACÁ
begin;

truncate table
  public.comments,
  public.attachments,
  public.notifications,
  public.activities,
  public.task_labels,
  public.task_checklist_items,
  public.idea_labels,
  public.idea_votes,
  public.dependencies,
  public.calendar_events,
  public.content_items,
  public.system_issues,
  public.ideas,
  public.tasks,
  public.project_members,
  public.projects
restart identity;

commit;
BORRAR HASTA ACÁ */
