import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Area } from "@/lib/tasks/constants";
import type { TaskLabel } from "@/lib/tasks/types";
import type { IdeaItem } from "./types";

const IDEA_SELECT = `
  id, title, description, area, created_at,
  creator:profiles!creator_id(id, full_name, color),
  idea_votes(user_id),
  idea_labels(labels(id, name, color)),
  converted_task:tasks!converted_task_id(id, title),
  converted_project:projects!converted_project_id(id, name)
`;

interface IdeaRow {
  id: string;
  title: string;
  description: string | null;
  area: Area | null;
  created_at: string;
  creator: { id: string; full_name: string; color: string } | null;
  idea_votes: { user_id: string }[];
  idea_labels: { labels: TaskLabel | null }[];
  converted_task: { id: string; title: string } | null;
  converted_project: { id: string; name: string } | null;
}

/** Todas las ideas con sus votos, etiquetas y comentarios. Se filtran y ordenan después (son pocas). */
export async function getIdeas(meId: string): Promise<IdeaItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ideas")
    .select(IDEA_SELECT)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`No se pudieron cargar las ideas: ${error.message}`);
  const rows = (data ?? []) as unknown as IdeaRow[];

  // Los comentarios cuelgan de cualquier tipo de elemento, así que se cuentan aparte.
  const commentCounts = new Map<string, number>();
  if (rows.length > 0) {
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("entity_id")
      .eq("entity_type", "idea")
      .in(
        "entity_id",
        rows.map((row) => row.id),
      );
    if (commentsError) throw new Error(`No se pudieron contar los comentarios: ${commentsError.message}`);
    for (const comment of (comments ?? []) as { entity_id: string }[]) {
      commentCounts.set(comment.entity_id, (commentCounts.get(comment.entity_id) ?? 0) + 1);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    area: row.area,
    createdAt: row.created_at,
    creator: row.creator
      ? { id: row.creator.id, fullName: row.creator.full_name, color: row.creator.color }
      : null,
    votes: row.idea_votes.length,
    votedByMe: row.idea_votes.some((vote) => vote.user_id === meId),
    commentCount: commentCounts.get(row.id) ?? 0,
    labels: row.idea_labels.flatMap((link) => (link.labels ? [link.labels] : [])),
    convertedTask: row.converted_task,
    convertedProject: row.converted_project,
  }));
}
