import { clientAdmin } from './supabase.js';

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  EDITEUR: 'editeur',
  LECTEUR: 'lecteur',
});

const ECRITURE_STANDARD = [ROLES.ADMIN, ROLES.EDITEUR];
const ECRITURE_ADMIN = [ROLES.ADMIN];

/** Collections réservées à l'admin seul */
const COLLECTIONS_SENSIBLES = new Set(['utilisateurs', 'parametres', 'seo']);

export function rolesAutorises(collection) {
  return COLLECTIONS_SENSIBLES.has(collection) ? ECRITURE_ADMIN : ECRITURE_STANDARD;
}

function extraireJeton(req) {
  const entete = req.headers.authorization || '';
  if (entete.startsWith('Bearer ')) return entete.slice(7).trim();
  return null;
}

async function chargerProfil(utilisateur) {
  const sb = clientAdmin();
  const selection = 'id, role, actif, email';

  let { data } = await sb
    .from('utilisateurs')
    .select(selection)
    .eq('id', utilisateur.id)
    .maybeSingle();

  if (!data && utilisateur.email) {
    ({ data } = await sb
      .from('utilisateurs')
      .select(selection)
      .eq('email', utilisateur.email)
      .maybeSingle());
  }

  return data || null;
}

/**
 * Valide le jeton Supabase de la requête et le rôle de l'utilisateur
 * pour la collection visée.
 * @returns {{ok:true, utilisateur:Object, role:string} | {ok:false, status:number, erreur:string}}
 */
export async function autentifier(req, collection) {
  const jeton = extraireJeton(req);
  if (!jeton) {
    return { ok: false, status: 401, erreur: 'Authentification requise.' };
  }

  let utilisateur = null;
  try {
    const { data, error } = await clientAdmin().auth.getUser(jeton);
    if (!error && data?.user) utilisateur = data.user;
  } catch (_) {
    utilisateur = null;
  }

  if (!utilisateur) {
    return { ok: false, status: 401, erreur: 'Session invalide ou expirée.' };
  }

  let profil = null;
  try {
    profil = await chargerProfil(utilisateur);
  } catch (_) {
    profil = null;
  }

  if (!profil) {
    return { ok: false, status: 403, erreur: 'Profil introuvable.' };
  }
  if (profil.actif === false) {
    return { ok: false, status: 403, erreur: 'Compte désactivé.' };
  }

  const roles = rolesAutorises(collection);
  if (!roles.includes(profil.role)) {
    return { ok: false, status: 403, erreur: 'Rôle insuffisant pour cette opération.' };
  }

  return { ok: true, utilisateur, role: profil.role, profil };
}
