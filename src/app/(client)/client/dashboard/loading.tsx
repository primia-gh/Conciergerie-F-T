import { Chargement, Squelette, SqueletteEnTete, SqueletteListe } from "@/components/espace/squelettes";

export default function Loading() {
  return (
    <Chargement>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SqueletteEnTete />
        <Squelette className="h-12 w-52" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Squelette className="h-28 rounded-lg" />
        <Squelette className="h-28 rounded-lg" />
        <Squelette className="col-span-2 h-28 rounded-lg sm:col-span-1" />
      </div>
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2">
          <Squelette className="mb-4 h-3 w-20" />
          <SqueletteListe />
        </div>
        <div className="flex flex-col gap-6">
          <Squelette className="h-44 rounded-lg" />
          <Squelette className="h-56 rounded-lg" />
        </div>
      </div>
    </Chargement>
  );
}
