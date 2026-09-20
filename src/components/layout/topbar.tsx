import { Suspense } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { UnreadBadge } from "@/components/notifications/unread-badge";
import { GlobalSearch } from "@/components/search/global-search";
import { Brand } from "./brand";
import { ReportIssueButton } from "./report-issue-button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-beige/85 px-4 py-3 backdrop-blur sm:px-8">
      <div className="lg:hidden">
        <Brand />
      </div>

      <div className="hidden max-w-xl flex-1 sm:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* En el celular no entra el campo: el ícono lleva a la página de búsqueda. */}
        <Link
          href="/buscar"
          aria-label="Buscar"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card transition hover:text-bordo active:scale-95 sm:hidden"
        >
          <Search className="size-5" aria-hidden />
        </Link>
        <ReportIssueButton />
        <div className="relative">
          <Link
            href="/notificaciones"
            aria-label="Notificaciones"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card transition hover:text-bordo active:scale-95"
          >
            <Bell className="size-5" aria-hidden />
          </Link>
          <Suspense fallback={null}>
            <UnreadBadge className="pointer-events-none absolute -right-1 -top-1 ring-2 ring-beige" />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
