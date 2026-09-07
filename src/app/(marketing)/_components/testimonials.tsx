/**
 * Volontairement sans témoignages fabriqués : le service n'a pas encore de
 * clients réels. Publier de faux avis serait trompeur (voir brief §34).
 * Cette section sera remplacée par de vrais retours après les premières
 * missions honorées.
 */
export function Testimonials() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="font-display text-3xl font-medium text-fg">Ils nous font confiance</h2>
        <p className="mt-4 text-fg-muted">
          Le service démarre tout juste. Les premiers retours de nos membres apparaîtront ici dès
          qu&apos;ils seront disponibles — nous préférons ne rien publier plutôt que d&apos;inventer.
        </p>
      </div>
    </section>
  );
}
