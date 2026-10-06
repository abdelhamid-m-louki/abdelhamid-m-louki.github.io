import { appliquerCors, gererPreflight } from '../_lib/cors.js';
import { clientAdmin } from '../_lib/supabase.js';
import { autentifier } from '../_lib/auth.js';

const COLLECTIONS = new Set([
  'articles',
  'projets',
  'competences',
  'experiences',
  'certifications',
  'formations',
  'categories',
  'tags',
  'medias',
  'parametres',
  'utilisateurs',
  'analytiques',
  'seo',
  'commentaires',
]);

/** Champs jamais écrits par l'API (sécurité) */
const CHAMPS_INTERDITS = new Set(['mot_de_passe_hash', '__proto__', 'constructor', 'prototype']);

function nettoyer(corps) {
  const copie = { ...corps };
  for (const champ of CHAMPS_INTERDITS) delete copie[champ];
  return copie;
}

function statutSupabase(error) {
  if (error.code === '23505') return 409;
  if (error.code === '23503') return 400;
  if (error.code === '42501' || error.code === 'PGRST301') return 403;
  if (error.code === 'PGRST116') return 404;
  return 500;
}

export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  const collection = String(req.query.collection || '');

  if (!COLLECTIONS.has(collection)) {
    return res.status(404).json({ erreur: 'Collection inconnue.' });
  }

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ erreur: 'Méthode non autorisée. Utilisez POST, PUT ou DELETE.' });
  }

  const auth = await autentifier(req, collection);
  if (!auth.ok) {
    return res.status(auth.status).json({ erreur: auth.erreur });
  }

  const sb = clientAdmin();
  const maintenant = new Date().toISOString();

  try {
    // CREATE
    if (req.method === 'POST') {
      const corps = req.body;
      if (!corps || typeof corps !== 'object' || Array.isArray(corps)) {
        return res.status(400).json({ erreur: 'Corps de requête invalide.' });
      }

      const aInserer = { ...nettoyer(corps), modifie_le: maintenant };
      if (!aInserer.cree_le) aInserer.cree_le = maintenant;

      const { data, error } = await sb.from(collection).insert(aInserer).select().single();
      if (error) return res.status(statutSupabase(error)).json({ erreur: error.message });

      return res.status(201).json({ donnees: data });
    }

    // DELETE / PUT — identifiant obligatoire
    const id = String(req.query.id || req.body?.id || '');
    if (!id) {
      return res.status(400).json({ erreur: 'Identifiant manquant (?id=…).' });
    }

    // UPDATE
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const corps = req.body;
      if (!corps || typeof corps !== 'object' || Array.isArray(corps)) {
        return res.status(400).json({ erreur: 'Corps de requête invalide.' });
      }

      const aMaj = { ...nettoyer(corps), modifie_le: maintenant };
      delete aMaj.id;
      delete aMaj.cree_le;

      if (Object.keys(aMaj).length === 0) {
        return res.status(400).json({ erreur: 'Aucun champ à mettre à jour.' });
      }

      const { data, error } = await sb
        .from(collection)
        .update(aMaj)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(statutSupabase(error)).json({ erreur: error.message });

      return res.status(200).json({ donnees: data });
    }

    // DELETE
    const { data, error } = await sb.from(collection).delete().eq('id', id).select();
    if (error) return res.status(statutSupabase(error)).json({ erreur: error.message });
    if (!data || data.length === 0) {
      return res.status(404).json({ erreur: 'Enregistrement introuvable.' });
    }

    return res.status(200).json({ supprime: true, id });
  } catch (err) {
    return res.status(500).json({ erreur: err?.message || 'Erreur serveur.' });
  }
}
