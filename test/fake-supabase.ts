export type Operation = {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filtres: [string, unknown][];
};

type Constructeur = Record<string, (...args: never[]) => unknown>;

/**
 * Faux client Supabase pour tester les actions serveur. Chaque requête
 * enregistre l'opération demandée (table, insert/update/delete, filtres), puis
 * `repondre` décide du résultat au moment où la requête est « terminée »
 * (await, single() ou maybeSingle()).
 */
export function fauxSupabase(repondre: (operation: Operation) => unknown) {
  const operations: Operation[] = [];

  const from = (table: string) => {
    const operation: Operation = { table, op: "select", filtres: [] };
    operations.push(operation);
    const resultat = () => Promise.resolve(repondre(operation));
    const b: Constructeur = {
      insert: (payload: unknown) => {
        operation.op = "insert";
        operation.payload = payload;
        return b;
      },
      update: (payload: unknown) => {
        operation.op = "update";
        operation.payload = payload;
        return b;
      },
      delete: () => {
        operation.op = "delete";
        return b;
      },
      select: () => b,
      order: () => b,
      limit: () => b,
      returns: () => b,
      eq: (colonne: string, valeur: unknown) => {
        operation.filtres.push([`eq:${colonne}`, valeur]);
        return b;
      },
      is: (colonne: string, valeur: unknown) => {
        operation.filtres.push([`is:${colonne}`, valeur]);
        return b;
      },
      in: (colonne: string, valeurs: unknown) => {
        operation.filtres.push([`in:${colonne}`, valeurs]);
        return b;
      },
      or: (expression: string) => {
        operation.filtres.push(["or", expression]);
        return b;
      },
      single: () => resultat(),
      maybeSingle: () => resultat(),
      then: (resolve: (v: unknown) => unknown) => resultat().then(resolve),
    };
    return b;
  };

  return { client: { from }, operations };
}
