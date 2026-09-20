import "server-only";

import { addDays, arToISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { bucketMyDay } from "@/lib/tasks/my-day";
import { getMyDayData } from "@/lib/tasks/queries";
import type { Person, Task } from "@/lib/tasks/types";
import { buildWeek, type WeekEvent, type WeekItem, type WeekTask } from "./week";

export interface HomeProject {
  id: string;
  name: string;
  status: string;
  /** 0 a 100. */
  progress: number;
  targetDate: string | null;
}

/** Un pedido "Necesito de…" pendiente que me involucra. */
export interface HomeRequest {
  id: string;
  title: string;
  dueDate: string | null;
  /** "incoming": me lo piden a mí; "outgoing": se lo pedí yo a otra persona. */
  direction: "incoming" | "outgoing";
  other: Person | null;
}

export interface HomeData {
  stats: { today: number; overdue: number; review: number; projects: number; requests: number };
  todayTasks: Task[];
  projects: HomeProject[];
  week: WeekItem[];
  requests: HomeRequest[];
}

interface PersonRow {
  id: string;
  full_name: string;
  color: string;
}

const toPerson = (row: PersonRow | null): Person | null =>
  row ? { id: row.id, fullName: row.full_name, color: row.color } : null;

/** Todo lo que muestra el Inicio, leído en paralelo. */
export async function getHomeData(meId: string, today: string): Promise<HomeData> {
  const supabase = await createClient();
  const weekStart = arToISO(today);
  const weekEnd = arToISO(addDays(today, 7)); // hasta el final del día 7 (no incluido)

  const [myDayData, projects, events, tasks, dependencies] = await Promise.all([
    getMyDayData(meId, today),
    supabase
      .from("projects_with_progress")
      .select("id, name, status, progress, target_date")
      .in("status", ["en_curso", "planificando"])
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, all_day, creator:profiles!created_by(id, full_name, color)")
      .gte("starts_at", weekStart)
      .lt("starts_at", weekEnd)
      .order("starts_at")
      .limit(20),
    supabase
      .from("tasks")
      .select("id, title, due_date, assignee:profiles!assignee_id(id, full_name, color)")
      .is("parent_task_id", null)
      .neq("status", "listo")
      .gte("due_date", today)
      .lte("due_date", addDays(today, 6))
      .order("due_date")
      .limit(30),
    supabase
      .from("dependencies")
      .select(
        "id, title, due_date, provider_id, requester:profiles!requester_id(id, full_name, color), provider:profiles!provider_id(id, full_name, color)",
      )
      .eq("status", "pendiente")
      .or(`requester_id.eq.${meId},provider_id.eq.${meId}`)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
  ]);

  for (const result of [projects, events, tasks, dependencies]) {
    if (result.error) throw new Error(`No se pudo cargar el Inicio: ${result.error.message}`);
  }

  // Las mismas cuentas que Mi día, para que los números coincidan entre pantallas.
  const day = bucketMyDay(myDayData.open, myDayData.reviewCandidates, today);

  const activeProjects = ((projects.data ?? []) as unknown as {
    id: string;
    name: string;
    status: string;
    progress: number;
    target_date: string | null;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    progress: row.progress,
    targetDate: row.target_date,
  }));

  const weekEvents: WeekEvent[] = ((events.data ?? []) as unknown as {
    id: string;
    title: string;
    starts_at: string;
    all_day: boolean;
    creator: PersonRow | null;
  }[]).map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    allDay: row.all_day,
    person: toPerson(row.creator),
  }));

  const weekTasks: WeekTask[] = ((tasks.data ?? []) as unknown as {
    id: string;
    title: string;
    due_date: string;
    assignee: PersonRow | null;
  }[]).map((row) => ({
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    person: toPerson(row.assignee),
  }));

  const requests: HomeRequest[] = ((dependencies.data ?? []) as unknown as {
    id: string;
    title: string;
    due_date: string | null;
    provider_id: string;
    requester: PersonRow | null;
    provider: PersonRow | null;
  }[]).map((row) => {
    const incoming = row.provider_id === meId;
    return {
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      direction: incoming ? "incoming" : "outgoing",
      other: toPerson(incoming ? row.requester : row.provider),
    };
  });

  return {
    stats: {
      today: day.today.length,
      overdue: day.overdue.length,
      review: day.review.length,
      projects: activeProjects.length,
      requests: requests.filter((request) => request.direction === "incoming").length,
    },
    todayTasks: day.today,
    projects: activeProjects,
    week: buildWeek(weekEvents, weekTasks),
    requests,
  };
}
