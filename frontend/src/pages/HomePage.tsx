export function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-3 px-3 py-8 sm:px-6">
      <h1 className="max-w-3xl text-3xl font-semibold tracking-normal sm:text-5xl">
        Politician Tracker
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
        Track congressional trades and inspect price movement around disclosure
        dates.
      </p>
    </main>
  );
}
