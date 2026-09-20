# ATTOS HQ · Pendientes anotados

Cosas que quedaron fuera de una etapa a propósito, para retomarlas más adelante.

## Para una etapa posterior (pedido de Felipe, Etapa 4)

- **Subtareas**: las tareas ya tienen `parent_task_id` en la base y el seed trae algunas, pero las listas y el Kanban solo muestran tareas de primer nivel.
- **Checklist** dentro de una tarea (tabla `task_checklist_items`, ya creada).
- **Adjuntos** (tabla `attachments` y bucket `attachments`, ya creados): capturas, imágenes, videos y archivos en tareas, y también en proyectos ("Comentarios y archivos" en la promesa original de Proyectos).

## Velocidad (diagnóstico del 2026-09-20; pendiente, NO aplicado a propósito)

Decisión de Felipe: por ahora no se optimiza. La app se va a desplegar en **Vercel, región US East**, junto a Supabase (East US, Ohio), y **Supabase no se mueve**. En producción, con la app y la base en la misma región, cada consulta cuesta pocos milisegundos y casi todo lo de abajo deja de notarse; hoy se nota porque el servidor de desarrollo corre en Argentina.

Lo medido desde la PC de Felipe (Argentina → Ohio): cada paso a Supabase cuesta ~190 ms como mínimo (con picos de hasta ~1 s); las consultas en paralelo casi no suman (10 a la vez ≈ 0,3–0,5 s; 10 una tras otra ≈ 1,9 s). Tiempos de servidor en desarrollo que reportó Felipe: Inicio 4,5 s, Mi día 2,2 s, Tareas 1,4–2,1 s, Ideas 2,2 s, Proyectos 0,6–1,0 s.

Consultas por pantalla (todas empiezan con `getUser` → perfil, 2 pasos en fila): Inicio 11 consultas / 3 pasos; Mi día 6 / 3; Tareas 6 / 3; Ideas 4 / 4 (los comentarios esperan a las ideas); Proyectos 4 / 3; detalle de proyecto 6 / 3, más 2 acciones en cola (comentarios e historial) que repiten la identidad.

Arreglos propuestos, en orden de impacto (cuando se decida hacerlos):

1. **Identidad sin red**: el proyecto firma con ES256, así que `getClaims()` valida la sesión localmente. Usarlo para saber quién es y pedir el perfil en paralelo con los datos. Quita 2 pasos en todas las pantallas y en todas las acciones (~0,4 s cada una). Contra: una sesión revocada se nota al vencer el token (hasta 1 h); la cuenta desactivada se sigue detectando por el perfil.
2. **Ideas**: contar los comentarios en paralelo en vez de después de leer las ideas (–1 paso).
3. **Menos consultas** en Inicio (lee `tasks` 3 veces y `dependencies` 2), Mi día y Tareas (pide personas y proyectos aunque en "Mis tareas" no hacen falta). Probablemente lo que más pesa en los 2–3 s: la base es chica y recibe hasta 9 consultas a la vez.
4. **Acciones**: registrar actividad y notificaciones con `after()` (Next 16) y en paralelo; hoy completar una tarea son 5 pasos en fila.
5. **Detalle de proyecto**: cargar comentarios e historial en el render del servidor en vez de 2 acciones encoladas.

Antes del punto 3 conviene medir: `npm run build` + `npm start` (separa el costo del modo desarrollo) y Supabase → Database → Query Performance (las consultas más lentas).

**Etapa 10:** la app se publica en Vercel región `cle1` (Cleveland, us-east-2, igual que Supabase Ohio). Con la base a pocos milisegundos, estos arreglos probablemente ya no hacen falta: **primero medir en producción** (Inicio, Mi día, Tareas, Ideas, Proyectos) y comparar con los tiempos de desarrollo de arriba; aplicar solo lo que siga lento. El proxy ya usa `getClaims()`; lo que falta del punto 1 es usarlo también en `getCurrentUser()`.

## Publicación (Etapa 10)

Hecho: región de Vercel fija en `vercel.json`, cabeceras de seguridad y `noindex` (`next.config.ts`, `robots.ts`), app instalable (`manifest.ts` + íconos), títulos por pantalla, páginas de error / no encontrado / carga, `.env.example`, `README.md` con la guía y `supabase/limpiar-datos-de-ejemplo.sql`.

Pendiente a propósito:
- **Dominio propio** (por ejemplo `hq.attos.com.ar`): hoy se usa la dirección `*.vercel.app`. Al agregarlo, actualizar la *Site URL* y las *Redirect URLs* de Supabase.
- **Plan de Supabase**: en el plan gratuito el proyecto se pausa tras 1 semana sin actividad y no hay copias de seguridad descargables. Para uso real conviene Pro (copias diarias de 7 días, sin pausa).
- **Política de contenido (CSP)**: no se agregó (hay que contemplar los scripts de Next y el websocket de Supabase); se puede sumar en modo "solo reportar" y endurecer después.
- **Monitoreo de errores** (por ejemplo Sentry) y **avisos si algo se cae**: hoy se ven en los *Logs* de Vercel y de Supabase.
- **"Olvidé mi contraseña"** necesita correo saliente propio (SMTP): el de Supabase por defecto envía muy pocos mails por hora.
- **Ramas y vistas previas**: cada rama que se suba a GitHub genera una dirección de prueba conectada a la misma base real. Mientras sean 3 personas, conviene trabajar solo sobre la rama principal.

## Otros pendientes que fueron quedando

- **Etiquetas**: se muestran en tareas e ideas, pero todavía no se pueden agregar ni quitar desde los formularios.
- **Editar comentarios**: hoy solo se pueden escribir y borrar los propios.
- **Etapa 9 (hecha)**, pendientes que quedaron fuera a propósito:
  - **Tiempo real fino**: hoy un cambio de otra persona hace que la pantalla actual se vuelva a leer entera (con un pequeño retraso, ~1 s). Aplicar solo el dato que cambió, mostrar "quién está viendo esto" (presencia) o avisos en vivo tipo "Bauti movió una tarjeta" queda para más adelante. Una ventana de edición ya abierta no se actualiza sola: si otra persona cambia lo mismo mientras la editás, gana quien guarda último.
  - **Búsqueda**: no incluye eventos del calendario, pedidos ("Necesito de…") ni personas; no busca dentro de archivos adjuntos (todavía no existen). Ordena por título primero y después por lo más reciente (no por relevancia). Si crece mucho el volumen de comentarios, conviene un índice de búsqueda en la base (`pg_trgm`/`tsvector`).
  - **Perfil**: la foto (`avatar_url`) todavía no se puede subir; se usa la inicial con el color elegido. No hay un perfil "público" con más datos (teléfono, cumpleaños).
  - **Configuración**: solo notificaciones, contraseña y estado de la conexión en vivo. Falta: elegir por qué medio recibir avisos (email, push), no molestar por horario, y el aviso por email de lo que vence.
- **Contenido y Sistemas (Etapa 8, hecho)**: pendientes que quedaron fuera a propósito:
  - **Capturas y archivos** en problemas ("Pasos para reproducir y capturas") y en publicaciones (piezas, videos): van con el resto de los adjuntos (tabla `attachments` y bucket, ya creados). Hoy los enlaces a Drive o a un moodboard se pegan en el campo "Enlaces" de una publicación.
  - **Convertir una idea en publicación** (la tabla ya tiene `content_items.idea_id`): hoy las ideas solo se convierten en tarea o proyecto.
  - **Quién puede aprobar**: hoy cualquier persona del equipo, incluida quien la hace. Si se quiere limitar (por ejemplo, solo Felipe), es una regla en `lib/content/rules.ts` y en `approveContent`.
  - Programar/publicar exige aprobación (regla en `lib/content/rules.ts`); si resulta molesto para algo simple (una historia del día), se puede relajar por formato.
  - **Novedades del sistema** (registro de lo que se lanzó a producción, que menciona el subtítulo de Sistemas): hoy lo resuelto queda 30 días en la columna "En producción".
  - **Publicar de verdad** (conectar con Instagram/Meta) y **recordatorio al vencer la fecha de publicación**: hoy solo se marca "atrasada" en la tarjeta.- **Calendario (Etapa 7, hecho)**: pendientes que quedaron fuera a propósito:
  - **Comentarios e historial propios** de un evento (la base ya lo permite con `entity_type = 'calendar_event'`); hoy solo se registra en la actividad del Inicio.
  - **Mover con el teclado** (hoy se abre el elemento y se cambia la fecha en el formulario) y **arrastrar para cambiar la hora o la duración**.
  - Vista de **un solo día**, **eventos que se repiten**, filtro por persona ("solo lo mío") y exportar/sincronizar con Google Calendar.
  - Un evento con hora que termina otro día (solo posible cargándolo directo en la base) pierde su hora de fin al editarlo, porque el formulario maneja una hora de fin del mismo día.
- **Progreso manual de un proyecto**: la base lo permite (`progress_override`), pero hoy el progreso siempre es automático.
- **URL propia para tareas, ideas, pedidos, publicaciones y problemas**: hoy se abren en una ventana emergente. Las notificaciones los abren con un parámetro (`/tareas?tarea=<id>`, `/ideas?idea=<id>`, `/pedidos?pedido=<id>`, `/contenido?contenido=<id>`, `/sistemas?problema=<id>`) que se limpia solo; los proyectos sí tienen página (`/proyectos/[id]`).
- **Recordar un pedido** ("Necesito de…"): un botón para volver a avisar a quien lo tiene pendiente; y editar un pedido (hoy se cancela y se crea de nuevo).
- **Olvidé mi contraseña** (recuperar el acceso por email desde el login; cambiarla estando adentro ya se puede en Configuración) y roles de administrador.
