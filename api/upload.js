import { appliquerCors, gererPreflight } from './_lib/cors.js';
import { clientAdmin } from './_lib/supabase.js';
import { autentifier } from './_lib/auth.js';

/**
 * Upload / suppression de fichiers — bucket Supabase par défaut « images ».
 * POST   { chemin, data: base64, contentType, bucket?, ecraser? }
 * DELETE ?chemin=…&bucket=…
 */

const BUCKETS_AUTORISES = new Set(['images', 'avatars', 'documents']);
const TAILLE_MAX_OCTETS = 3 * 1024 * 1024; // limite corps Vercel ≈ 4,5 Mo
const CHEMIN_REGEX = /^[A-Za-z0-9][A-Za-z0-9_\-./]*$/;

function validerChemin(chemin) {
  if (!chemin || typeof chemin !== 'string') return 'Chemin manquant.';
  if (chemin.length > 300) return 'Chemin trop long.';
  if (chemin.includes('..') || chemin.startsWith('/') || chemin.includes('//')) {
    return 'Chemin invalide.';
  }
  if (!CHEMIN_REGEX.test(chemin)) return 'Caractères non autorisés dans le chemin.';
  return null;
}

export default async function handler(req, res) {
  appliquerCors(req, res);
  if (gererPreflight(req, res)) return;

  if (!['POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ erreur: 'Méthode non autorisée. Utilisez POST ou DELETE.' });
  }

  // Même exigence de rôle que la collection « medias » (admin ou éditeur)
  const auth = await autentifier(req, 'medias');
  if (!auth.ok) {
    return res.status(auth.status).json({ erreur: auth.erreur });
  }

  const bucket = String(req.query.bucket || req.body?.bucket || 'images');
  if (!BUCKETS_AUTORISES.has(bucket)) {
    return res.status(400).json({ erreur: 'Bucket non autorisé.' });
  }

  const sb = clientAdmin();

  // SUPPRESSION
  if (req.method === 'DELETE') {
    const chemin = String(req.query.chemin || '');
    const erreurChemin = validerChemin(chemin);
    if (erreurChemin) return res.status(400).json({ erreur: erreurChemin });

    try {
      const { error } = await sb.storage.from(bucket).remove([chemin]);
      if (error) return res.status(500).json({ erreur: error.message });
      return res.status(200).json({ supprime: true, chemin, bucket });
    } catch (err) {
      return res.status(500).json({ erreur: err?.message || 'Suppression impossible.' });
    }
  }

  // UPLOAD
  const corps = req.body || {};
  const chemin = String(corps.chemin || '');
  const contentType = String(corps.contentType || 'image/webp');
  const donneesBase64 = typeof corps.data === 'string' ? corps.data : '';
  const ecraser = corps.ecraser === true;

  const erreurChemin = validerChemin(chemin);
  if (erreurChemin) return res.status(400).json({ erreur: erreurChemin });

  if (!donneesBase64) {
    return res.status(400).json({ erreur: 'Fichier manquant (data base64).' });
  }

  let tampon;
  try {
    tampon = Buffer.from(donneesBase64, 'base64');
  } catch (_) {
    return res.status(400).json({ erreur: 'Base64 invalide.' });
  }

  if (tampon.length === 0) return res.status(400).json({ erreur: 'Fichier vide.' });
  if (tampon.length > TAILLE_MAX_OCTETS) {
    return res.status(413).json({ erreur: 'Fichier trop volumineux (max 3 Mo).' });
  }

  try {
    const { data, error } = await sb.storage.from(bucket).upload(chemin, tampon, {
      cacheControl: '3600',
      upsert: ecraser,
      contentType,
    });
    if (error) return res.status(500).json({ erreur: error.message });

    const { data: publique } = sb.storage.from(bucket).getPublicUrl(data.path);
    return res.status(201).json({
      donnees: { url: publique?.publicUrl || '', chemin: data.path, bucket },
    });
  } catch (err) {
    return res.status(500).json({ erreur: err?.message || 'Upload impossible.' });
  }
}
