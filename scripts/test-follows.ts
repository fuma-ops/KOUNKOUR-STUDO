// Alertes « en un clic » : rappel des concours suivis, résumé des nouveaux concours, jamais deux fois.
import { followPlan, renderFollowPush, type FollowContest, type FollowSub } from '../api/_lib/follows.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
};
const TODAY = '2026-11-03';
const c = (id: string, deadline: string, published: string | null, positions = 1): FollowContest => ({
  id, slug: `slug-${id}`, title_fr: `Concours ${id}`, title_ar: null, deadline_date: deadline, published_at: published, positions,
});
const contests = [c('a', '2026-11-05', '2026-10-20T08:00:00Z'), c('b', '2026-11-20', '2026-11-03T07:00:00Z', 30), c('d', '2026-11-25', '2026-11-03T07:30:00Z', 4), c('e', '2026-11-04', '2026-10-01T00:00:00Z')];
const sub = (o: Partial<FollowSub>): FollowSub => ({ endpoint: 'https://push.example/x', p256dh: 'k', auth: 'a', lang: 'fr', new_contests: false, since: '2026-11-02T06:00:00Z', follows: [], sent: [], ...o });

const p1 = followPlan(sub({ follows: ['a'] }), contests, TODAY);
check('rappel : concours suivi qui ferme dans 2 jours', !!p1 && p1.reminders.length === 1 && p1.reminders[0].id === 'a' && !p1.fresh.length);
check('rappel déjà envoyé : rien', followPlan(sub({ follows: ['a'], sent: [['a', 'rappel']] }), contests, TODAY) === null);
check('concours suivi loin de la date limite : pas de rappel', followPlan(sub({ follows: ['b'] }), contests, TODAY) === null);
const p2 = followPlan(sub({ new_contests: true }), contests, TODAY)!;
check('résumé : seulement les concours publiés depuis le dernier envoi, les plus gros d’abord', p2.fresh.map((x) => x.id).join() === 'b,d');
const push2 = renderFollowPush(p2, TODAY, 'https://kounkour.com');
check('résumé : titre et lien vers la liste', push2.title === '🆕 2 nouveaux concours aujourd\'hui' && push2.url.startsWith('https://kounkour.com/concours?'));
const push1 = renderFollowPush(followPlan(sub({ follows: ['a', 'e'], new_contests: true }), contests, TODAY)!, TODAY, 'https://kounkour.com');
check('rappel prioritaire + nouveaux mentionnés', push1.title.startsWith('⏰') && push1.body.includes('clôture demain') && push1.body.includes('2 nouveaux concours'), push1.body);
const ar = renderFollowPush(followPlan(sub({ lang: 'ar', new_contests: true }), contests, TODAY)!, TODAY, 'https://kounkour.com');
check('arabe : texte et lien en arabe', ar.lang === 'ar' && ar.url.includes('lang=ar'));
console.log(failed ? `\n${failed} échec(s)` : '\nTous les tests des alertes en un clic passent.');
process.exit(failed ? 1 : 0);
