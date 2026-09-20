-- =====================================================================
-- ATTOS HQ · Datos demo (Etapa 0B)
--
-- Cómo usarlo:
--   1. Primero tienen que existir las 3 cuentas (Authentication > Users).
--   2. Cambiá los 3 emails de abajo (líneas v_email_...) por los reales.
--   3. Pegalo COMPLETO en Supabase > SQL Editor y ejecutalo.
--
-- Es seguro correrlo más de una vez: si ya hay datos, no carga nada.
-- Las fechas se calculan a partir del día en que se ejecuta.
-- =====================================================================

do $seed$
declare
  -- >>> CAMBIAR ESTOS 3 EMAILS <<<
  v_email_felipe constant text := 'felifc2001@gmail.com';
  v_email_bauti  constant text := 'bautichaves@gmail.com';
  v_email_cami   constant text := 'camilanducci@gmail.com';

  v_tz constant text := 'America/Argentina/Buenos_Aires';
  v_today date := (now() at time zone v_tz)::date;
  v_now timestamptz := now();
  v_mon date;
  v_wed date;
  v_fri date;

  v_felipe uuid;
  v_bauti uuid;
  v_cami uuid;

  l_precios uuid := gen_random_uuid();
  l_clientes uuid := gen_random_uuid();
  l_stock uuid := gen_random_uuid();
  l_redes uuid := gen_random_uuid();
  l_diseno uuid := gen_random_uuid();
  l_okt uuid := gen_random_uuid();

  p_okt uuid := gen_random_uuid();
  p_madre uuid := gen_random_uuid();
  p_emp uuid := gen_random_uuid();

  t_precios uuid := gen_random_uuid();
  t_mayorista uuid := gen_random_uuid();
  t_okt_prod uuid := gen_random_uuid();
  t_reposicion uuid := gen_random_uuid();
  t_historias uuid := gen_random_uuid();
  t_reel_semana uuid := gen_random_uuid();
  t_viernes uuid := gen_random_uuid();
  t_diseno_promo uuid := gen_random_uuid();
  t_bug uuid := gen_random_uuid();
  t_stock uuid := gen_random_uuid();

  i_heladera uuid := gen_random_uuid();
  i_okt uuid := gen_random_uuid();
  i_emp uuid := gen_random_uuid();
  i_auto uuid := gen_random_uuid();
  i_sorteo uuid := gen_random_uuid();

  c_promo uuid := gen_random_uuid();
  c_combos uuid := gen_random_uuid();
  c_heladera uuid := gen_random_uuid();
  c_cambios uuid := gen_random_uuid();

  s_bug uuid := gen_random_uuid();
  s_stock uuid := gen_random_uuid();
  s_resuelto uuid := gen_random_uuid();

  d_precio uuid := gen_random_uuid();
  d_promo uuid := gen_random_uuid();
begin
  -- Próximos lunes, miércoles y viernes (hoy cuenta si ya es ese día)
  v_mon := v_today + ((1 - extract(isodow from v_today)::int + 7) % 7);
  v_wed := v_today + ((3 - extract(isodow from v_today)::int + 7) % 7);
  v_fri := v_today + ((5 - extract(isodow from v_today)::int + 7) % 7);

  -- Buscar las 3 cuentas
  select id into v_felipe from auth.users where lower(email) = lower(v_email_felipe);
  select id into v_bauti from auth.users where lower(email) = lower(v_email_bauti);
  select id into v_cami from auth.users where lower(email) = lower(v_email_cami);

  if v_felipe is null or v_bauti is null or v_cami is null then
    raise exception
      'No encontré alguna de las 3 cuentas. Revisá que los emails de arriba sean exactamente los que creaste en Authentication > Users.';
  end if;

  -- No duplicar datos si ya se cargaron antes
  if exists (select 1 from public.projects) or exists (select 1 from public.tasks) then
    raise notice 'Ya hay datos cargados: no se hizo ningún cambio.';
    return;
  end if;

  -- -------------------------------------------------------------------
  -- Personas
  -- -------------------------------------------------------------------
  insert into public.profiles (id, email, full_name, area, default_area, color) values
    (v_felipe, v_email_felipe, 'Felipe', 'Comercial & Operaciones', 'comercial', '#631636'),
    (v_bauti, v_email_bauti, 'Bauti', 'Marketing, Redes & Diseño', 'marketing', '#d9694a'),
    (v_cami, v_email_cami, 'Cami', 'Sistemas', 'sistemas', '#6d5bb5')
  on conflict (id) do update set
    full_name = excluded.full_name,
    area = excluded.area,
    default_area = excluded.default_area,
    color = excluded.color;

  -- -------------------------------------------------------------------
  -- Etiquetas
  -- -------------------------------------------------------------------
  insert into public.labels (id, name, color) values
    (l_precios, 'Precios', '#3f6fb0'),
    (l_clientes, 'Clientes', '#631636'),
    (l_stock, 'Stock', '#2f7d8a'),
    (l_redes, 'Redes', '#d9694a'),
    (l_diseno, 'Diseño', '#6d5bb5'),
    (l_okt, 'Oktoberfest', '#b98416');

  -- -------------------------------------------------------------------
  -- Proyectos
  -- -------------------------------------------------------------------
  insert into public.projects (id, name, description, owner_id, start_date, target_date, status, created_by) values
    (p_okt, 'Campaña Oktoberfest',
      'Campaña de cervezas y combos de temporada: productos, precios, contenido y carga en el sistema.',
      v_felipe, v_today - 14, v_today + 20, 'en_curso', v_felipe),
    (p_madre, 'Campaña Día de la Madre',
      'Selección de productos, fotos, diseños y reel para el Día de la Madre.',
      v_bauti, v_today - 10, v_today + 29, 'en_curso', v_felipe),
    (p_emp, 'Nueva sección para empresas',
      'Propuesta para oficinas y empresas: pedidos recurrentes y precios por volumen.',
      v_felipe, v_today + 5, v_today + 60, 'planificando', v_felipe);

  insert into public.project_members (project_id, user_id) values
    (p_okt, v_felipe), (p_okt, v_bauti), (p_okt, v_cami),
    (p_madre, v_felipe), (p_madre, v_bauti), (p_madre, v_cami),
    (p_emp, v_felipe), (p_emp, v_cami);

  -- -------------------------------------------------------------------
  -- Tareas
  -- -------------------------------------------------------------------
  insert into public.tasks
    (id, title, description, assignee_id, creator_id, area, project_id, due_date, priority, status, completed_at)
  values
    -- Felipe
    (t_precios, 'Tener precios de cerveza Andes actualizados',
      'Revisar la lista del proveedor y actualizar los precios de venta.',
      v_felipe, v_felipe, 'comercial', null, v_today, 'alta', 'en_curso', null),
    (t_mayorista, 'Contactar cliente mayorista',
      'Presentar la nueva lista de precios y ofrecer condiciones por volumen.',
      v_felipe, v_felipe, 'comercial', null, v_today, 'media', 'por_hacer', null),
    (t_okt_prod, 'Definir productos campaña Oktoberfest',
      'Elegir cervezas, combos y precios especiales para la campaña.',
      v_felipe, v_felipe, 'comercial', p_okt, v_today, 'urgente', 'por_hacer', null),
    (gen_random_uuid(), 'Confirmar stock con proveedor', null,
      v_felipe, v_felipe, 'operaciones', null, v_today, 'baja', 'por_hacer', null),
    (gen_random_uuid(), 'Actualizar lista de precios de gaseosas', null,
      v_felipe, v_felipe, 'comercial', null, v_today - 1, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Responder consulta de bar del centro', null,
      v_felipe, v_felipe, 'comercial', null, v_today - 2, 'alta', 'en_curso', null),
    (t_reposicion, 'Coordinar reposición de heladeras de clientes', null,
      v_felipe, v_felipe, 'operaciones', null, v_today + 1, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Negociar precio de cerveza artesanal para Oktoberfest', null,
      v_felipe, v_felipe, 'comercial', p_okt, v_today - 3, 'alta', 'listo', v_now - interval '3 days'),
    (gen_random_uuid(), 'Definir productos Día de la Madre', null,
      v_felipe, v_felipe, 'comercial', p_madre, v_today - 9, 'media', 'listo', v_now - interval '8 days'),
    (gen_random_uuid(), 'Cargar precios Día de la Madre', null,
      v_felipe, v_felipe, 'comercial', p_madre, v_today - 8, 'media', 'listo', v_now - interval '7 days'),
    (gen_random_uuid(), 'Confirmar stock Día de la Madre', null,
      v_felipe, v_felipe, 'operaciones', p_madre, v_today - 7, 'media', 'listo', v_now - interval '6 days'),
    (gen_random_uuid(), 'Relevar necesidades de clientes empresa', null,
      v_felipe, v_felipe, 'comercial', p_emp, v_today + 10, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Armar propuesta de precios para empresas', null,
      v_felipe, v_felipe, 'comercial', p_emp, v_today + 14, 'media', 'por_hacer', null),
    -- Bauti
    (t_historias, 'Diseñar historias campaña cerveza',
      'Serie de 5 historias con la promo y el llamado a pedir por WhatsApp.',
      v_bauti, v_felipe, 'marketing', p_okt, v_today + 1, 'alta', 'en_curso', null),
    (t_reel_semana, 'Editar reel pedido de la semana', null,
      v_bauti, v_bauti, 'marketing', null, v_today + 2, 'media', 'para_revisar', null),
    (t_viernes, 'Preparar contenido del viernes', null,
      v_bauti, v_bauti, 'marketing', null, v_fri, 'alta', 'por_hacer', null),
    (t_diseno_promo, 'Diseño promo cerveza', null,
      v_bauti, v_felipe, 'marketing', p_okt, v_today - 1, 'alta', 'listo', v_now - interval '12 minutes'),
    (gen_random_uuid(), 'Sesión de fotos productos Oktoberfest', null,
      v_bauti, v_bauti, 'marketing', p_okt, v_today - 4, 'media', 'listo', v_now - interval '4 days'),
    (gen_random_uuid(), 'Reel Oktoberfest', null,
      v_bauti, v_bauti, 'marketing', p_okt, v_today + 7, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Fotografías Día de la Madre', null,
      v_bauti, v_bauti, 'marketing', p_madre, v_today - 6, 'media', 'listo', v_now - interval '6 days'),
    (gen_random_uuid(), 'Diseños Día de la Madre', null,
      v_bauti, v_bauti, 'marketing', p_madre, v_today + 5, 'alta', 'en_curso', null),
    (gen_random_uuid(), 'Reel Día de la Madre', null,
      v_bauti, v_bauti, 'marketing', p_madre, v_today + 9, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Diseño de flyer para clientes mayoristas', null,
      v_bauti, v_felipe, 'marketing', null, v_wed, 'media', 'en_curso', null),
    -- Cami
    (t_bug, 'Corregir error al modificar pedidos',
      'El total del pedido no se actualiza al cambiar las cantidades.',
      v_cami, v_felipe, 'sistemas', null, v_today + 1, 'alta', 'en_curso', null),
    (gen_random_uuid(), 'Agregar filtro por cliente', null,
      v_cami, v_felipe, 'sistemas', null, v_today + 7, 'media', 'por_hacer', null),
    (t_stock, 'Revisar funcionamiento del stock', null,
      v_cami, v_cami, 'sistemas', null, v_today + 3, 'media', 'para_revisar', null),
    (gen_random_uuid(), 'Cargar productos Oktoberfest en el sistema', null,
      v_cami, v_felipe, 'sistemas', p_okt, v_today + 4, 'media', 'por_hacer', null),
    (gen_random_uuid(), 'Productos Día de la Madre cargados', null,
      v_cami, v_felipe, 'sistemas', p_madre, v_today - 5, 'media', 'listo', v_now - interval '5 days'),
    (gen_random_uuid(), 'Implementación adicional Día de la Madre', null,
      v_cami, v_felipe, 'sistemas', p_madre, v_today + 8, 'media', 'por_hacer', null);

  -- Subtareas
  insert into public.tasks (title, assignee_id, creator_id, area, project_id, parent_task_id, priority, status) values
    ('Elegir cervezas artesanales', v_felipe, v_felipe, 'comercial', p_okt, t_okt_prod, 'media', 'por_hacer'),
    ('Definir combos y promos', v_felipe, v_felipe, 'comercial', p_okt, t_okt_prod, 'media', 'por_hacer');

  -- Checklists
  insert into public.task_checklist_items (task_id, text, is_done) values
    (t_precios, 'Pedir lista al proveedor', true),
    (t_precios, 'Cargar precios en el sistema', false),
    (t_precios, 'Avisar a Bauti para el flyer', false),
    (t_bug, 'Reproducir el error', true),
    (t_bug, 'Revisar el cálculo del total', false),
    (t_bug, 'Probar con pedidos grandes', false);

  insert into public.task_labels (task_id, label_id) values
    (t_precios, l_precios), (t_mayorista, l_clientes), (t_okt_prod, l_okt),
    (t_historias, l_okt), (t_historias, l_diseno), (t_reel_semana, l_redes),
    (t_viernes, l_redes), (t_diseno_promo, l_diseno), (t_stock, l_stock),
    (t_reposicion, l_stock);

  -- -------------------------------------------------------------------
  -- Ideas
  -- -------------------------------------------------------------------
  insert into public.ideas
    (id, title, description, creator_id, area, converted_project_id, created_at)
  values
    (i_heladera, 'Reel: cuánto cuesta llenar una heladera con ATTOS',
      'Mostrar cuánto sale llenar la heladera de un bar con productos ATTOS, producto por producto.',
      v_bauti, 'marketing', null, v_now - interval '1 day'),
    (i_okt, 'Crear campaña Oktoberfest',
      'Campaña de cervezas y combos para la temporada, con contenido y promos.',
      v_felipe, 'comercial', p_okt, v_now - interval '20 days'),
    (i_emp, 'Nueva sección para empresas',
      'Una propuesta pensada para oficinas y empresas: pedidos recurrentes y precios por volumen.',
      v_felipe, 'comercial', p_emp, v_now - interval '5 days'),
    (i_auto, 'Automatizar confirmación de pedidos',
      'Que el sistema mande la confirmación al cliente apenas se carga el pedido.',
      v_cami, 'sistemas', null, v_now - interval '3 days'),
    (i_sorteo, 'Sorteo por Instagram para clientes frecuentes',
      'Sortear un combo entre los clientes que más piden, para fidelizar.',
      v_bauti, 'marketing', null, v_now - interval '2 days');

  insert into public.idea_votes (idea_id, user_id) values
    (i_heladera, v_felipe), (i_heladera, v_cami),
    (i_okt, v_felipe), (i_okt, v_bauti), (i_okt, v_cami),
    (i_emp, v_felipe), (i_emp, v_bauti),
    (i_auto, v_cami), (i_auto, v_felipe),
    (i_sorteo, v_bauti);

  insert into public.idea_labels (idea_id, label_id) values
    (i_heladera, l_redes), (i_okt, l_okt), (i_sorteo, l_redes);

  -- -------------------------------------------------------------------
  -- Contenido
  -- -------------------------------------------------------------------
  insert into public.content_items
    (id, title, idea_id, project_id, format, status, assignee_id, creator_id, publish_at, copy, links,
     review_status, reviewed_by, reviewed_at)
  values
    (gen_random_uuid(), 'Pedido de la semana', null, null, 'reel', 'produccion', v_bauti, v_bauti,
      ((v_today + 2) + time '18:00') at time zone v_tz,
      '📦 Así se arma el pedido de la semana de un bar. ¡Del depósito a tu puerta!', '{}',
      'pendiente', null, null),
    (gen_random_uuid(), 'Historias campaña cerveza', null, p_okt, 'historia', 'diseno', v_bauti, v_bauti,
      ((v_today + 3) + time '12:00') at time zone v_tz,
      '🍺 Se viene Oktoberfest. Pedí tus cervezas por WhatsApp y armamos el pedido.', '{}',
      'pendiente', null, null),
    (c_promo, 'Promo cerveza Andes', null, p_okt, 'post', 'para_aprobar', v_bauti, v_bauti,
      ((v_today + 2) + time '12:00') at time zone v_tz,
      '🍺 Esta semana, la Andes con precio especial para tu negocio. Pedí por WhatsApp y te la llevamos.',
      array['https://example.com/moodboard-oktoberfest'],
      'pendiente', null, null),
    (c_heladera, 'Cuánto cuesta llenar una heladera con ATTOS', i_heladera, null, 'reel', 'ideas', v_bauti, v_bauti,
      null, null, '{}', 'pendiente', null, null),
    (c_combos, 'Combos Oktoberfest', null, p_okt, 'post', 'programado', v_bauti, v_bauti,
      ((v_today + 5) + time '12:00') at time zone v_tz,
      '🍻 Armá tu combo Oktoberfest: más cerveza, mejor precio.', '{}',
      'aprobado', v_felipe, v_now - interval '5 hours'),
    (gen_random_uuid(), 'Gracias por elegirnos', null, null, 'post', 'publicado', v_bauti, v_bauti,
      ((v_today - 3) + time '12:00') at time zone v_tz,
      '💛 Gracias a todos los que eligen ATTOS cada semana.', '{}',
      'aprobado', v_felipe, v_now - interval '4 days'),
    (gen_random_uuid(), 'Campaña Día de la Madre', null, p_madre, 'campana', 'produccion', v_bauti, v_bauti,
      ((v_today + 14) + time '11:00') at time zone v_tz,
      null, '{}', 'pendiente', null, null),
    (c_cambios, 'Historia: promo del finde', null, null, 'historia', 'diseno', v_bauti, v_bauti,
      ((v_today + 1) + time '19:00') at time zone v_tz,
      '🎉 Este finde, promo en cervezas. ¡Pedí antes del viernes!', '{}',
      'cambios_solicitados', v_felipe, v_now - interval '2 hours');

  -- -------------------------------------------------------------------
  -- Sistemas
  -- -------------------------------------------------------------------
  insert into public.system_issues
    (id, title, description, category, priority, status, reporter_id, assignee_id, steps_to_reproduce, created_at)
  values
    (s_bug, 'Al editar la cantidad de un producto, el total no se actualiza inmediatamente.',
      'El total del pedido queda con el valor anterior hasta que se refresca la página.',
      'bug', 'alta', 'en_desarrollo', v_felipe, v_cami,
      E'1. Abrir un pedido existente.\n2. Cambiar la cantidad de un producto.\n3. El total sigue mostrando el valor anterior hasta refrescar.',
      v_now - interval '1 day 2 hours'),
    (s_stock, 'Fix stock al cancelar pedidos',
      'Al cancelar un pedido, el stock de los productos no se devuelve.',
      'bug', 'alta', 'testing', v_felipe, v_cami,
      E'1. Cargar un pedido.\n2. Cancelarlo.\n3. Ver que el stock sigue descontado.',
      v_now - interval '3 days'),
    (gen_random_uuid(), 'Filtro por cliente en la lista de pedidos',
      'Poder buscar pedidos por cliente sin recorrer toda la lista.',
      'mejora', 'media', 'por_revisar', v_felipe, v_cami, null, v_now - interval '2 days'),
    (gen_random_uuid(), 'Automatizar confirmación de pedidos',
      'Enviar la confirmación al cliente automáticamente al cargar el pedido.',
      'nueva_funcionalidad', 'baja', 'reportado', v_felipe, null, null, v_now - interval '3 days'),
    (gen_random_uuid(), 'Backup semanal de la base de datos', null,
      'mantenimiento', 'baja', 'produccion', v_cami, v_cami, null, v_now - interval '6 days'),
    (s_resuelto, 'El descuento por cliente no se guardaba',
      'Al cargar un pedido con descuento, el sistema ignoraba el porcentaje.',
      'bug', 'media', 'produccion', v_felipe, v_cami,
      E'1. Cargar un pedido de un cliente con descuento.\n2. Guardar.\n3. El descuento no aparece en el total.',
      v_now - interval '4 days'),
    (gen_random_uuid(), 'Exportar pedidos a Excel', null,
      'idea_tecnica', 'baja', 'reportado', v_cami, null, null, v_now - interval '1 day');

  -- -------------------------------------------------------------------
  -- Calendario
  -- -------------------------------------------------------------------
  insert into public.calendar_events
    (title, description, category, kind, starts_at, ends_at, all_day, project_id, created_by)
  values
    ('Reunión semanal del equipo', 'Repaso de la semana y prioridades.', 'reuniones', 'reunion',
      (v_mon + time '10:00') at time zone v_tz, (v_mon + time '10:45') at time zone v_tz, false, null, v_felipe),
    ('Lanzamiento campaña Oktoberfest', null, 'marketing', 'lanzamiento',
      (v_today + 8)::timestamp at time zone v_tz, null, true, p_okt, v_bauti),
    ('Día de la Madre', 'Fecha comercial clave.', 'comercial', 'fecha_comercial',
      (date '2026-10-18')::timestamp at time zone v_tz, null, true, p_madre, v_felipe),
    ('Reunión con proveedor de cerveza', null, 'comercial', 'reunion',
      ((v_wed + 1) + time '10:00') at time zone v_tz, ((v_wed + 1) + time '11:00') at time zone v_tz, false, null, v_felipe),
    ('Deploy de mejoras del sistema', null, 'sistemas', 'deadline',
      ((v_today + 5) + time '18:00') at time zone v_tz, null, false, null, v_cami),
    ('Reposición de stock de gaseosas', null, 'operaciones', 'evento',
      ((v_today + 2) + time '09:00') at time zone v_tz, null, false, null, v_felipe),
    ('Semana Oktoberfest', 'Semana de mayor demanda de cerveza.', 'comercial', 'evento',
      (v_today + 14)::timestamp at time zone v_tz, (v_today + 20)::timestamp at time zone v_tz, true, p_okt, v_felipe);

  -- -------------------------------------------------------------------
  -- "Necesito de…"
  -- -------------------------------------------------------------------
  insert into public.dependencies
    (id, requester_id, provider_id, title, description, due_date, status, delivered_at, task_id, project_id)
  values
    (d_precio, v_bauti, v_felipe, 'Precio final de los productos',
      'Lo necesito para cerrar el contenido del viernes.', v_wed + 1, 'pendiente', null, t_viernes, p_okt),
    (gen_random_uuid(), v_felipe, v_bauti, 'Diseño de flyer para clientes mayoristas',
      'Para mandarlo junto con la lista de precios.', v_wed, 'pendiente', null, t_mayorista, null),
    (d_promo, v_felipe, v_bauti, 'Diseño promo cerveza', null, v_today - 1, 'entregado',
      v_now - interval '2 hours', null, p_okt),
    (gen_random_uuid(), v_felipe, v_cami, 'Filtro por cliente en el sistema',
      'Para buscar pedidos por cliente más rápido.', v_today + 7, 'pendiente', null, null, null);

  -- -------------------------------------------------------------------
  -- Comentarios
  -- -------------------------------------------------------------------
  insert into public.comments (entity_type, entity_id, author_id, body, created_at) values
    ('task', t_precios, v_bauti, 'Felipe, ¿me pasás los precios finales para armar el flyer?', v_now - interval '3 hours'),
    ('task', t_precios, v_felipe, 'Hoy a la tarde te los paso.', v_now - interval '2 hours 30 minutes'),
    ('project', p_okt, v_felipe, 'Arrancamos con la selección de productos y después bajamos al diseño.', v_now - interval '2 days'),
    ('project', p_okt, v_bauti, '¡Buenísimo! Ya tengo un moodboard armado.', v_now - interval '2 days' + interval '1 hour'),
    ('idea', i_heladera, v_felipe, '¡Me encanta! Podemos mostrar la heladera de un bar real.', v_now - interval '20 hours'),
    ('idea', i_heladera, v_cami, '+1. También sirve para explicar los combos.', v_now - interval '18 hours'),
    ('content_item', c_promo, v_bauti, 'Te dejo el post para aprobar: copy y diseño listos.', v_now - interval '40 minutes'),
    ('content_item', c_cambios, v_felipe, 'Cambiá el precio por el nuevo y sumá el logo al final.', v_now - interval '2 hours'),
    ('system_issue', s_bug, v_cami, 'Ya lo reproduje: el total se recalcula recién al guardar. Lo arreglo hoy.', v_now - interval '20 hours'),
    ('system_issue', s_bug, v_felipe, '¡Gracias, Cami!', v_now - interval '19 hours');

  -- -------------------------------------------------------------------
  -- Actividad del equipo
  -- -------------------------------------------------------------------
  insert into public.activities (actor_id, action, entity_type, entity_id, entity_title, metadata, created_at) values
    (v_bauti, 'completo', 'task', t_diseno_promo, 'Diseño promo cerveza', '{}', v_now - interval '12 minutes'),
    (v_bauti, 'movio', 'content_item', c_promo, 'Promo cerveza Andes', '{"to":"para_aprobar"}', v_now - interval '40 minutes'),
    (v_cami, 'movio', 'system_issue', s_stock, 'Fix stock al cancelar pedidos', '{"from":"en_desarrollo","to":"testing"}', v_now - interval '1 hour'),
    (v_felipe, 'solicito_cambios', 'content_item', c_cambios, 'Historia: promo del finde', '{}', v_now - interval '2 hours'),
    (v_bauti, 'entrego', 'dependency', d_promo, 'Diseño promo cerveza', '{}', v_now - interval '2 hours'),
    (v_felipe, 'creo', 'project', p_madre, 'Campaña Día de la Madre', '{}', v_now - interval '3 hours'),
    (v_felipe, 'aprobo', 'content_item', c_combos, 'Combos Oktoberfest', '{}', v_now - interval '5 hours'),
    (v_cami, 'completo', 'system_issue', s_resuelto, 'El descuento por cliente no se guardaba', '{}', v_now - interval '1 day'),
    (v_felipe, 'creo', 'system_issue', s_bug, 'Al editar la cantidad de un producto, el total no se actualiza inmediatamente.', '{}', v_now - interval '1 day 2 hours'),
    (v_bauti, 'creo', 'idea', i_sorteo, 'Sorteo por Instagram para clientes frecuentes', '{}', v_now - interval '2 days'),
    (v_felipe, 'creo', 'task', t_okt_prod, 'Definir productos campaña Oktoberfest', '{}', v_now - interval '2 days');

  -- -------------------------------------------------------------------
  -- Notificaciones
  -- -------------------------------------------------------------------
  insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, message, read_at, created_at) values
    (v_felipe, v_bauti, 'aprobacion_solicitada', 'content_item', c_promo, 'Bauti solicita tu aprobación: Promo cerveza Andes.', null, v_now - interval '40 minutes'),
    (v_felipe, v_bauti, 'comentario', 'task', t_precios, 'Bauti comentó en Tener precios de cerveza Andes actualizados.', null, v_now - interval '3 hours'),
    (v_felipe, v_bauti, 'pedido_nuevo', 'dependency', d_precio, 'Bauti necesita de vos: Precio final de los productos.', null, v_now - interval '5 hours'),
    (v_felipe, v_bauti, 'pedido_entregado', 'dependency', d_promo, 'Bauti entregó lo que esperabas: Diseño promo cerveza.', v_now - interval '1 hour', v_now - interval '2 hours'),
    (v_felipe, v_cami, 'problema_resuelto', 'system_issue', s_resuelto, 'Cami solucionó un problema que reportaste.', null, v_now - interval '1 day'),
    (v_felipe, null, 'vence_pronto', 'task', t_reposicion, 'Una tarea vence mañana: Coordinar reposición de heladeras de clientes.', null, v_now - interval '6 hours'),
    (v_bauti, v_felipe, 'asignacion', 'task', t_historias, 'Felipe te asignó: Diseñar historias campaña cerveza.', null, v_now - interval '1 day'),
    (v_bauti, v_felipe, 'aprobacion_resuelta', 'content_item', c_cambios, 'Felipe pidió cambios en Historia: promo del finde.', null, v_now - interval '2 hours'),
    (v_cami, v_felipe, 'asignacion', 'system_issue', s_bug, 'Felipe reportó un problema: el total no se actualiza al editar cantidades.', null, v_now - interval '1 day 2 hours');

  raise notice 'Datos demo cargados correctamente.';
end
$seed$;
