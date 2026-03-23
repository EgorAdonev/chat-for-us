import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center animate-pulse bg-muted/20 mx-auto max-w-6xl w-full px-4" />
      </header>
      <main className="flex-1 container max-w-6xl mx-auto p-4 space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Sidebar Skeleton */}
          <div className="hidden md:block space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
          {/* Chat Area Skeleton */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Skeleton className="h-10 w-1/3" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                  <Skeleton className={`h-16 w-2/3 rounded-lg ${i % 2 === 0 ? 'bg-primary/20' : ''}`} />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}