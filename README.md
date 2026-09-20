# ATTOS HQ

El centro operativo interno del equipo ATTOS: tareas, calendario, proyectos, ideas, contenido de marketing,
Sistemas, pedidos entre personas, notificaciones y búsqueda. Next.js 16 + Supabase (base de datos, login y tiempo real).

> Antes de tocar código de Next.js, leé `AGENTS.md`: esta versión tiene cambios respecto de lo que se conoce.

## Correrlo en tu compu

```bash
npm install
cp .env.example .env.local   # y completá los dos valores (Supabase > Project Settings > API)
npm run dev                  # http://localhost:3000
```

Otros comandos: `npm run build` (compilar como en producción), `npm start` (correr lo compilado),
`npm run lint`, `npm run db:check` (revisa la conexión con Supabase).

## La base de datos

Los archivos SQL están en `supabase/`. Se ejecutan **una vez, en orden**, pegándolos completos en
Supabase > SQL Editor:

1. `migrations/20260919000000_esquema_inicial.sql` (tablas, permisos, disparadores)
2. `seed.sql` (datos de ejemplo; solo para probar)
3. `migrations/20260920000000_avisos_de_vencimientos.sql` (activar antes la extensión **pg_cron**)
4. `migrations/20260921000000_busqueda_y_preferencias.sql`

Para pasar de los datos de ejemplo a los reales: `limpiar-datos-de-ejemplo.sql` (lee su encabezado; borra en dos pasos).

## Publicarlo en Vercel

El proyecto ya trae `vercel.json` con la región **cle1 (Cleveland, us-east-2)**, la misma que Supabase Ohio.

1. Subir el código a un repositorio **privado** de GitHub.
2. En Vercel: *Add New > Project*, elegir el repositorio (Framework: Next.js, sin cambiar nada).
3. Antes de desplegar, cargar las variables de entorno (Production, Preview y Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Desplegar. Después, en Supabase > Authentication > URL Configuration: poner la dirección de Vercel como
   *Site URL* y agregarla en *Redirect URLs* (con `/**` al final).
5. Comprobar en Vercel > Settings > Functions que la región sea Cleveland (cle1).

Cada `git push` a la rama principal despliega solo. Si falta una variable, la app lo dice (y hay que volver a desplegar:
las variables `NEXT_PUBLIC_*` se incorporan al compilar).

## Seguridad en pocas palabras

- Las dos variables de Supabase son públicas por diseño. La protección está en las políticas de la base (RLS): solo
  las personas con sesión leen y escriben. El registro público está cerrado: las cuentas las crea quien administra el proyecto.
- Nunca se usa (ni se debe poner en este repositorio) la clave `service_role` / secret de Supabase.
- `next.config.ts` agrega cabeceras de seguridad y evita que la app se indexe en buscadores.

## Pendientes

Ver `ROADMAP.md`.
