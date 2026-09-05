export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="container mx-auto min-h-[60vh] px-4 py-10"
      role="status"
    >
      <span className="sr-only">Loading page</span>
      <div className="mx-auto max-w-6xl animate-pulse space-y-8" aria-hidden="true">
        <div className="h-44 rounded-2xl bg-muted" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-full bg-muted" />
          <div className="h-10 w-36 rounded-full bg-muted" />
          <div className="h-10 w-24 rounded-full bg-muted" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="space-y-3" key={index}>
              <div className="aspect-[4/3] rounded-xl bg-muted" />
              <div className="h-5 w-4/5 rounded bg-muted" />
              <div className="h-4 w-2/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
