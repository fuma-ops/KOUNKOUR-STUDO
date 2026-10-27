// Nouvel essai d'un chargement réseau qui a échoué (connexion mobile lente, coupure brève) :
// sans cela, un seul échec laissait le site afficher « 0 concours ».
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(load: () => Promise<T>, ok: (v: T) => boolean, delays = [1500, 4000, 8000]): Promise<T> {
  let last = await load().catch(() => undefined as unknown as T);
  for (const ms of delays) {
    if (ok(last)) return last;
    await wait(ms);
    last = await load().catch(() => undefined as unknown as T);
  }
  return last;
}
