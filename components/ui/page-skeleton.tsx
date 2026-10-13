/** Shown for a beat while a dynamic route resolves its params. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-8 sm:px-8 sm:pt-12" aria-hidden="true">
      <div className="h-3 w-24 rounded bg-surface" />
      <div className="mt-6 h-9 w-80 max-w-full rounded-lg bg-surface" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-surface" />
      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-64 rounded-2xl bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
