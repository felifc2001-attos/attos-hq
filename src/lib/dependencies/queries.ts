import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/tasks/types";
import type { RequestItem } from "./types";

const REQUEST_SELECT = `
  id, title, description, due_date, status, delivered_at, created_at,
  requester_id, provider_id,
  requester:profiles!requester_id(id, full_name, color),
  provider:profiles!provider_id(id, full_name, color),
  task:tasks!task_id(id, title),
  project:projects!project_id(id, name)
`;

interface PersonRow {
  id: string;
  full_name: string;
  color: string;
}

interface RequestRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pendiente" | "entregado";
  delivered_at: string | null;
  created_at: string;
  requester_id: string;
  provider_id: string;
  requester: PersonRow | null;
  provider: PersonRow | null;
  task: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
}

const toPerson = (row: PersonRow | null): Person | null =>
  row ? { id: row.id, fullName: row.full_name, color: row.color } : null;

function toRequest(row: RequestRow): RequestItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    requesterId: row.requester_id,
    providerId: row.provider_id,
    requester: toPerson(row.requester),
    provider: toPerson(row.provider),
    task: row.task,
    project: row.project,
  };
}

/** Mis pedidos: todos los pendientes en los que participo y los últimos entregados. */
export async function getRequests(meId: string): Promise<RequestItem[]> {
  const supabase = await createClient();
  const involvesMe = `requester_id.eq.${meId},provider_id.eq.${meId}`;

  const [pending, delivered] = await Promise.all([
    supabase.from("dependencies").select(REQUEST_SELECT).eq("status", "pendiente").or(involvesMe).limit(100),
    supabase
      .from("dependencies")
      .select(REQUEST_SELECT)
      .eq("status", "entregado")
      .or(involvesMe)
      .order("delivered_at", { ascending: false })
      .limit(30),
  ]);
  if (pending.error) throw new Error(`No se pudieron cargar los pedidos: ${pending.error.message}`);
  if (delivered.error) throw new Error(`No se pudieron cargar los pedidos entregados: ${delivered.error.message}`);

  return [...(pending.data ?? []), ...(delivered.data ?? [])].map((row) => toRequest(row as unknown as RequestRow));
}

/** Un pedido puntual, para abrirlo desde una notificación (puede ser uno entregado hace tiempo). */
export async function getRequestById(id: string): Promise<RequestItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("dependencies").select(REQUEST_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
  return data ? toRequest(data as unknown as RequestRow) : null;
}
