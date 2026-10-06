import { appliquerCors, gererPreflight } from './_lib/cors.js';

/** Port serverless de l'ancien api/ia.php — même contrat JSON, clés en env vars */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }

  const corps = req.body || {};

  // Health-check utilisé par scripts/ai/ia.js
  if (corps.ping) {
    return res.status(200).json({ ok: true });
  }

  const texte = typeof corps.texte === 'string' ? corps.texte.trim() : '';
  const fournisseur = typeof corps.fournisseur === 'string' ? corps.fournisseur : 'gemini';
  const promptSystem = typeof corps.promptSystem === 'string' ? corps.promptSystem : '';

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
