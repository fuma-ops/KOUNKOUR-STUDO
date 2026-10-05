# Radar : analyse des annonces par Claude (procédure)

Décision du propriétaire (04/10/2026, journal des décisions) : l'analyse IA des
annonces est faite par **Claude dans une session Claude Code**, gratuitement
(abonnement du propriétaire), sans clé API payante. Le propriétaire déclenche
l'analyse en écrivant **« go »** ; ce « go » vaut validation humaine au sens du
cahier §13.5. Claude publie ensuite et rend compte de ce qui a été mis en ligne.

## Flux

1. **Scan** (admin → Radar → « Scanner ») : `api/radar/scrape-live.ts` stocke les
   annonces dans `radar_candidates` (statut `pending_review`).
2. **Préparation** (automatique après le scan, ou bouton « Préparer pour
   l'analyse ») : `api/radar/fetch-docs.ts` — exécuté sur Vercel, qui a accès aux
   sites sources — ouvre chaque annonce et stocke dans `radar_documents` :
   - `kind = 'page'` : texte lisible de l'annonce (`text_content`) et HTML brut
     de la page (`raw_html`, ≤ 400 Ko) pour vérifier l'extraction ;
   - `kind = 'image' | 'pdf'` : fichier de l'arrêté en base64 (`content_b64`),
     avec `sha256`, `mime`, `size_bytes` (fichiers > 3 Mo : lien seul, `fetch_error`).
   L'annonce passe en `analysis_status = 'a_analyser'`.
   - Sites qui bloquent la lecture automatique (dreamjob : page, API WordPress
     et flux RSS refusés ou sans l'arrêté) : l'annonce reste en `erreur` /
     `a_verifier`. L'admin ouvre l'annonce, enregistre l'image ou le PDF de
     l'arrêté et le joint dans Admin → Radar & revue → « Arrêtés à joindre »
     (document `url = ajout-admin://…`, image recompressée en JPEG ≤ 3 Mo).
     L'annonce passe alors en `a_analyser`. Aucun contournement de blocage.
3. **« go » du propriétaire** → Claude applique la procédure ci-dessous.

## Procédure Claude (à suivre à la lettre)

### Lire

```sql
select c.id, c.title_original, c.source_url, c.administration_name, c.deadline_date, c.positions,
       d.id doc_id, d.kind, d.url, d.mime, d.size_bytes, d.fetch_error, left(d.text_content, 4000) texte
from radar_candidates c left join radar_documents d on d.candidate_id = c.id
where c.analysis_status = 'a_analyser' order by c.created_at, d.kind;
```

Fichiers : `select content_b64 from radar_documents where id = '<doc_id>'`, puis
décoder le base64 dans le scratchpad (`base64 -d > fichier.jpg|pdf`) et lire le
fichier (images et PDF sont lisibles directement).

### Extraire (règles absolues — cahier §0, §13.4, CLAUDE.md « ne jamais inventer »)

- Uniquement ce qui est **écrit** dans le texte ou l'arrêté. Rien de déduit.
- Case illisible (tampon, flou, coupure) → valeur `null` + `note` (« nombre
  illisible (tampon) »), jamais un chiffre deviné.
- Dates : jour local marocain, format ISO `YYYY-MM-DD`.
- Chaque poste : `province`, `category`, `diploma`, `specialty`, `count`,
  `source_ref` (« arrêté p.1, ligne 4 »).
- Garder « ou autre domaine connexe » tel quel (le Smart Match le classe « à vérifier »).

### Décider

- **Publier** si : organisme identifié, intitulé lu, source officielle confirmée
  (lien officiel dans l'annonce, ou arrêté signé/tamponné de l'organisme lisible
  dans les fichiers), et pas de doublon (`contests.source_url`, référence, même
  organisme + même intitulé + même date limite).
- Sinon `analysis_status = 'a_verifier'` avec la raison dans `analysis.raison`.
- Annonce hors sujet (formation privée, stage, emploi non public) → `rejete`.

### Publier (dans une transaction)

1. `administrations` : réutiliser par nom ; sinon créer (`slug`, `name_fr`, `name_ar` si lu).
2. `contests` : `slug` unique (intitulé translittéré + suffixe 6 hex),
   `title_original`, `title_fr`, `title_ar` si lu, `status = 'publie'`,
   `source_url` (officielle de préférence), `source_org`, `publication_date`,
   `deadline_date`, `exam_date`, `positions` (total lu), `diploma_fr`, `region_fr`,
   `grade_fr`, `reference`, `summary_fr` (résumé factuel, sans ajout),
   `published_at = now()`, `verified_at = now()`.
3. `contest_positions` : une ligne par poste lu (ordre = `position`).
4. `contest_criteria` : diplômes et spécialités distincts, `source_page`,
   `source_excerpt`, `verification_state = 'a_verifier'`.
5. `radar_candidates` : `status = 'imported'`, `imported_contest_id`,
   `analysis_status = 'publie'`, `analysis` (JSON de l'extraction + sources),
   `analyzed_at = now()`.

### Rendre compte

Liste des concours publiés (lien `/concours/<slug>`), des annonces « à vérifier »
avec la raison, des rejets, et de chaque champ laissé vide (illisible).
