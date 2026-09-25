import { Chargement, Squelette, SqueletteEnTete } from "@/components/espace/squelettes";

export default function Loading() {
  return (
    <Chargement>
      <Squelette className="mb-6 h-4 w-28" />
      <SqueletteEnTete />
      <Squelette className="mt-8 h-28 rounded-lg" />
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Squelette className="h-3 w-40" />
          <Squelette className="h-64 rounded-lg" />
        </div>
        <div className="flex flex-col gap-5">
          <Squelette className="h-24 rounded-lg" />
          <Squelette className="h-72 rounded-lg" />
        </div>
      </div>
    </Chargement>
  );
}
