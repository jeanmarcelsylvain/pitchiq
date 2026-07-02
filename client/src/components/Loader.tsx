/* Branded full-screen loader — wordmark with a sweeping accent underline.
   Used for auth resolution and route-level code-split boundaries. */
export function Loader() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <span className="font-display text-xl font-bold tracking-[0.18em] text-slate-200">PITCHIQ</span>
        <div className="relative h-[2px] w-28 overflow-hidden rounded-full bg-slate-800">
          <div className="loader-sweep absolute inset-y-0 w-1/3 rounded-full bg-pitch-500" />
        </div>
      </div>
    </div>
  )
}
