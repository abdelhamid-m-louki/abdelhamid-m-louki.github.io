import { appliquerCors, gererPreflight } from './_lib/cors.js';
import { clientAdmin } from './_lib/supabase.js';

/**
 * POST /api/vues?id=<article>
 * Incrémente le compteur de vues d'un article (appel public, sans jeton).
 * Renvoie le nouveau total.
 */
export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }

  const id = String(req.query.id || req.body?.id || '');
  if (!id) {
    return res.status(400).json({ erreur: 'Identifiant manquant (?id=…).' });
  }

  try {
    const sb = clientAdmin();
    const { data: actuel } = await sb
      .from('articles')
      .select('vues, statut')
      .eq('id', id)
      .maybeSingle();

    if (!actuel) {
      return res.status(404).json({ erreur: 'Article introuvable.' });
    }
    if (actuel.statut !== 'publié') {
      return res.status(404).json({ erreur: 'Article introuvable.' });
    }

    const vues = (actuel.vues || 0) + 1;
    const { data, error } = await sb
      .from('articles')
      .update({ vues })
      .eq('id', id)
      .select('vues')
      .single();

    if (error) {
      return res.status(500).json({ erreur: error.message });
    }
    return res.status(200).json({ vues: data?.vues || vues });
  } catch (err) {
    return res.status(500).json({ erreur: err?.message || 'Erreur serveur.' });
  }
}