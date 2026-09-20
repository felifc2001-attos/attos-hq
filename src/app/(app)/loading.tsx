// Se muestra al instante mientras una pantalla lee sus datos, con el menú ya a la vista:
// así navegar se siente inmediato en vez de quedarse la pantalla vieja un momento.
export default function AppLoading() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse">
      <span className="sr-only">Cargando…</span>

      <div className="mb-8">
        <div className="h-9 w-48 rounded-xl bg-beige-deep/80" />
        <div className="mt-3 h-4 w-72 max-w-full rounded-lg bg-beige-deep/60" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="h-9 w-40 rounded-full bg-beige-deep/60" />
        <div className="h-9 w-32 rounded-full bg-beige-deep/60" />
        <div className="h-9 w-36 rounded-full bg-beige-deep/60" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-20 rounded-3xl border border-line/70 bg-surface shadow-card" />
        ))}
      </div>
    </div>
  );
}
