export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent"
        role="status"
        aria-label="Chargement…"
      />
    </div>
  );
}
