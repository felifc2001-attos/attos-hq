"use client";

import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { moveContent } from "@/lib/content/actions";
import { CONTENT_PUBLISHED_DAYS, CONTENT_STATUSES } from "@/lib/content/constants";
import type { ContentItem } from "@/lib/content/types";
import { ContentCard } from "./content-card";

/** El recorrido de las publicaciones, de la idea a publicada. */
export function ContentBoard({ items, today }: { items: ContentItem[]; today: string }) {
  return (
    <PipelineBoard
      id="content-pipeline"
      columns={CONTENT_STATUSES}
      items={items}
      onMove={moveContent}
      renderCard={(item) => <ContentCard item={item} today={today} />}
      describeItem={(item) => `la publicación ${item.title}`}
      emptyText="Soltá una publicación acá"
      hint={
        <>
          Arrastrá las tarjetas entre columnas. Para programar o publicar, primero tiene que estar aprobado desde “Para
          aprobar”. En “Publicado” se ve lo de los últimos {CONTENT_PUBLISHED_DAYS} días.
        </>
      }
    />
  );
}
