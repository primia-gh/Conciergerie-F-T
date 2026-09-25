import { Chargement, SqueletteEnTete, SqueletteListe } from "@/components/espace/squelettes";

/** Chargement générique d'une page d'espace connecté : en-tête puis liste. */
export function PageLoading() {
  return (
    <Chargement>
      <SqueletteEnTete />
      <div className="mt-10">
        <SqueletteListe />
      </div>
    </Chargement>
  );
}
