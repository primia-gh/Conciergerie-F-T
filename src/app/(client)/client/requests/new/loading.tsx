import { Chargement, Squelette } from "@/components/espace/squelettes";

export default function Loading() {
  return (
    <Chargement className="max-w-2xl">
      <Squelette className="h-3 w-32" />
      <div className="mt-5 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Squelette key={i} className="h-1" />
        ))}
      </div>
      <Squelette className="mt-10 h-10 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Squelette key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </Chargement>
  );
}
