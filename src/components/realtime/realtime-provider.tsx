"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "offline";

// Las tablas cuyos cambios hacen que se vuelva a leer la pantalla (todas están publicadas en supabase_realtime).
const TABLES = [
  "tasks",
  "task_checklist_items",
  "projects",
  "project_members",
  "ideas",
  "idea_votes",
  "content_items",
  "system_issues",
  "calendar_events",
  "dependencies",
  "comments",
  "notifications",
  "activities",
  "profiles",
] as const;

/** Se espera un momento antes de refrescar: una sola acción suele tocar varias tablas (la tarea, el historial, un aviso…). */
const REFRESH_DELAY_MS = 800;
/** Como mucho una lectura cada tanto, aunque alguien esté haciendo muchos cambios seguidos. */
const MIN_GAP_MS = 2500;

const RealtimeContext = createContext<RealtimeStatus>("connecting");

/** ¿Está conectada la actualización en vivo? (Para mostrarlo en Configuración.) */
export function useRealtimeStatus(): RealtimeStatus {
  return useContext(RealtimeContext);
}

// Mantiene abierta una conexión con Supabase Realtime. Cuando otra persona (o esta misma desde otra pestaña)
// cambia algo, la pantalla actual se vuelve a leer del servidor con router.refresh(): no se recarga la página
// y no se pierde lo que se está escribiendo. Los permisos los sigue decidiendo la base (cada quien recibe solo lo que puede ver).
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: RealtimeChannel | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastRefresh = 0;
    let waiting = false; // hay un cambio que todavía no se reflejó en pantalla
    let pointerDown = false;
    let wasOffline = false;

    // No se refresca con la pestaña oculta ni mientras hay un botón del mouse o un dedo apretado
    // (por ejemplo, arrastrando una tarjeta): se deja para cuando termine.
    const flush = () => {
      if (document.hidden || pointerDown) {
        waiting = true;
        return;
      }
      waiting = false;
      lastRefresh = Date.now();
      router.refresh();
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(flush, Math.max(REFRESH_DELAY_MS, MIN_GAP_MS - (Date.now() - lastRefresh)));
    };

    const onVisibility = () => {
      if (!document.hidden && waiting) schedule();
    };
    const onPointerDown = () => {
      pointerDown = true;
    };
    const onPointerUp = () => {
      pointerDown = false;
      if (waiting) schedule();
    };
    // Al volver el internet se lee todo de nuevo, por si se perdió algún cambio.
    const onOnline = () => schedule();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    window.addEventListener("online", onOnline);

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      // Realtime tiene que conocer la sesión para aplicar los mismos permisos que el resto de la app.
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase.channel("attos-hq-live");
      for (const table of TABLES) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule);
      }
      channel.subscribe((subscription) => {
        if (cancelled) return;
        if (subscription === "SUBSCRIBED") {
          setStatus("live");
          // Si estuvo desconectada, se leen los cambios que pudo haberse perdido.
          if (wasOffline) schedule();
          wasOffline = false;
        } else if (subscription === "CHANNEL_ERROR" || subscription === "TIMED_OUT" || subscription === "CLOSED") {
          wasOffline = true;
          setStatus("offline");
        }
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
      window.removeEventListener("online", onOnline);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return <RealtimeContext.Provider value={status}>{children}</RealtimeContext.Provider>;
}
