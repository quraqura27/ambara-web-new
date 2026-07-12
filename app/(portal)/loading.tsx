export default function PortalLoading() {
  return (
    <div aria-busy="true" aria-label="Loading portal data" className="space-y-6">
      <div className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <div className="h-36 animate-pulse rounded-lg border border-white/5 bg-white/[0.03]" key={index} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-96 animate-pulse rounded-lg border border-white/5 bg-white/[0.03]" />
        <div className="h-96 animate-pulse rounded-lg border border-white/5 bg-white/[0.03]" />
      </div>
    </div>
  );
}
