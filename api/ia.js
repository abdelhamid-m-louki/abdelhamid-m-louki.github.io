import { appliquerCors, gererPreflight } from './_lib/cors.js';
import { autentifier } from './_lib/auth.js';

/**
 * Port serverless de l'ancien api/ia.php — même contrat JSON, clés en env vars.
 * Sécurité : seuls les utilisateurs authentifiés (rôle éditeur/admin) peuvent
 * déclencher une génération. Les prompts système vivent côté serveur
 * (liste blanche par action) — le client ne fournit que « action » + « texte ».
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/** Actions reconnues — miroir du client scripts/ai/ia.js */
const ACTIONS = Object.freeze({
  REECRIRE:      'reecrire',
  RESUMER:       'resumer',
  AMELIORER:     'ameliorer',
  HUMANISER:     'humaniser',
  GENERER_TITRES: 'generer_titres',
  GENERER_META:  'generer_meta',
  GENERER_TAGS:  'generer_tags',
  GENERER_EXTRAIT: 'generer_extrait',
  CORRIGER:      'corriger',
  SIMPLIFIER:    'simplifier',
});

/** Prompts système par action — liste blanche serveur */
const PROMPTS_SYSTEME = Object.freeze({
  [ACTIONS.REECRIRE]: `Tu es un rédacteur éditorial expert francophone.
Réécris le texte fourni en conservant le sens original mais en améliorant :
- La clarté et la fluidité
- Le style éditorial et la voix narrative
- La précision du vocabulaire
- La structure des phrases
Réponds UNIQUEMENT avec le texte réécrit, sans commentaire.`,

  [ACTIONS.RESUMER]: `Tu es un éditeur de presse francophone expert.
Rédige un résumé concis (2-3 phrases maximum) du texte fourni.
Style : direct, informatif, accrocheur comme un chapô de journal.
Réponds UNIQUEMENT avec le résumé, sans introduction ni commentaire.`,

  [ACTIONS.AMELIORER]: `Tu es un correcteur de style éditorial francophone.
Améliore le texte fourni en :
- Supprimant les répétitions et les tournures maladroites
- Enrichissant le vocabulaire
- Améliorant la ponctuation et le rythme
- Respectant les règles typographiques françaises (guillemets, espaces, etc.)
Réponds UNIQUEMENT avec le texte amélioré.`,

  [ACTIONS.HUMANISER]: `Tu es un auteur humain francophone.
Réécris ce texte pour qu'il semble naturellement écrit par un humain :
- Varie les constructions de phrases
- Utilise des expressions idiomatiques françaises
- Ajoute des nuances et des opinions personnelles subtiles
- Évite les formulations trop formelles ou mécaniques
Réponds UNIQUEMENT avec le texte humanisé.`,

  [ACTIONS.GENERER_TITRES]: `Tu es un rédacteur en chef de presse française.
Génère 5 titres alternatifs accrocheurs pour le contenu fourni.
Format de réponse : JSON uniquement, tableau de chaînes.
Exemple : ["Titre 1", "Titre 2", "Titre 3", "Titre 4", "Titre 5"]
Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`,

  [ACTIONS.GENERER_META]: `Tu es un expert SEO francophone.
Génère les métadonnées SEO optimisées pour le contenu fourni.
Format de réponse : JSON uniquement avec les clés :
- titre (max 60 caractères, accrocheur et SEO)
- description (max 160 caractères, incitative et descriptive)
- motsClés (tableau de 5-8 mots-clés pertinents)
Réponds UNIQUEMENT avec le JSON valide.`,

  [ACTIONS.GENERER_TAGS]: `Tu es un indexeur éditorial francophone.
Génère une liste de tags pertinents pour le contenu fourni.
Format de réponse : JSON uniquement, tableau de chaînes en minuscules.
Maximum 10 tags. Exemple : ["tag-un", "tag-deux", "tag-trois"]
Réponds UNIQUEMENT avec le JSON.`,

  [ACTIONS.GENERER_EXTRAIT]: `Tu es un éditeur de presse francophone.
Génère un extrait accrocheur de 160-200 mots pour le contenu fourni.
L'extrait doit :
- Accrocher le lecteur dès la première phrase
- Présenter l'essentiel sans tout révéler
- Inviter à lire la suite
Réponds UNIQUEMENT avec l'extrait, sans commentaire.`,

  [ACTIONS.CORRIGER]: `Tu es un correcteur typographique francophone expert.
Corrige le texte fourni en respectant :
- L'orthographe française
- La grammaire et la conjugaison
- Les règles typographiques françaises (guillemets « », espaces insécables, etc.)
- La ponctuation
Réponds UNIQUEMENT avec le texte corrigé, sans commentaire.`,

  [ACTIONS.SIMPLIFIER]: `Tu es un spécialiste de la communication claire francophone.
Simplifie le texte fourni pour le rendre accessible :
- Remplace le jargon technique par des mots simples
- Raccourcis les phrases longues
- Utilise un vocabulaire courant
- Conserve l'information essentielle
Réponds UNIQUEMENT avec le texte simplifié.`,
});

export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }

  const corps = req.body || {};

  // Health-check public (aucune donnée transmise, aucune clé consommée)
  if (corps.ping) {
    return res.status(200).json({ ok: true });
  }

  // Toute génération est réservée aux utilisateurs authentifiés
  // (éditeur ou admin : même niveau que la rédaction d'articles)
  const auth = await autentifier(req, 'articles');
  if (!auth.ok) {
    return res.status(auth.status).json({ erreur: auth.erreur });
  }

  const action = typeof corps.action === 'string' ? corps.action : '';
  const texte = typeof corps.texte === 'string' ? corps.texte.trim() : '';
  const fournisseur = typeof corps.fournisseur === 'string' ? corps.fournisseur : 'gemini';
  const promptSystem = PROMPTS_SYSTEME[action];

  if (!action || !promptSystem) {
    return res.status(400).json({ erreur: 'Action IA inconnue ou non autorisée.' });
  }
  if (!texte) {
    return res.status(400).json({ erreur: 'Texte vide.' });
  }

  try {
    let resultat = '';

    if (fournisseur === 'gemini') {
      const cle = process.env.GEMINI_KEY;
      if (!cle) throw new Error('Clé Gemini manquante.');

      const reponse = await fetch(`${GEMINI_URL}?key=${cle}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${promptSystem}\n\n${texte}` }] }],
        }),
        signal: AbortSignal.timeout(30000),
      });

      const donnees = await reponse.json().catch(() => null);
      resultat = donnees?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!reponse.ok && !resultat) {
        throw new Error(donnees?.error?.message || `Erreur Gemini ${reponse.status}.`);
      }
    } else if (fournisseur === 'openai') {
      const cle = process.env.OPENAI_KEY;
      if (!cle) throw new Error('Clé OpenAI manquante.');

      const reponse = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cle}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: promptSystem },
            { role: 'user', content: texte },
          ],
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const donnees = await reponse.json().catch(() => null);
      resultat = donnees?.choices?.[0]?.message?.content || '';
      if (!reponse.ok && !resultat) {
        throw new Error(donnees?.error?.message || `Erreur OpenAI ${reponse.status}.`);
      }
    } else {
      throw new Error('Fournisseur inconnu.');
    }

    if (!resultat) throw new Error('Réponse vide.');

    return res.status(200).json({ resultat });
  } catch (err) {
    const timeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res.status(500).json({
      erreur: timeout ? 'Délai IA dépassé.' : err?.message || 'Erreur IA.',
    });
  }
}