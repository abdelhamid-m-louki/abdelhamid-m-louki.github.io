/**
 * ADAPTATEUR SUPABASE
 * Portfolio Éditorial — Stockage PostgreSQL via Supabase
 *
 * Implémente l'interface de stockage en utilisant
 * Supabase comme backend PostgreSQL serverless.
 *
 * Le client Supabase est chargé depuis le CDN ESM.
 * Les clés sont lues depuis la configuration globale.
 */

'use strict';

import {
  InterfaceStockage,
  ErreurStockage,
  ErreurNonTrouve,
  ErreurAutorisation,
  ErreurValidation,
} from './interfaces.js';

/** Buckets de stockage Supabase */
const BUCKETS = Object.freeze({
  MEDIAS:    'medias',
  AVATARS:   'avatars',
  DOCUMENTS: 'documents',
});

export class AdaptateurSupabase extends InterfaceStockage {
  /**
   * @param {Object} config
   * @param {string} config.url   - URL du projet Supabase
   * @param {string} config.cle   - Clé anon publique Supabase
   */
  constructor(config) {
    super();

    if (!config?.url || !config?.cle) {
      throw new ErreurStockage(
        'Configuration Supabase manquante. Vérifiez SUPABASE_URL et SUPABASE_ANON_KEY.',
        'CONFIG_MANQUANTE'
      );
    }

    this._config = config;
    this._client = null;
    this._initialise = false;
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  async initialiser() {
    if (this._initialise) return;

    try {
      // Import dynamique du client Supabase (CDN ESM)
      const { createClient } = await import(
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
      );

      this._client = createClient(this._config.url, this._config.cle, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'portfolio-editorial/1.0',
          },
        },
      });

      this._initialise = true;
    } catch (err) {
      throw new ErreurStockage(
        `Impossible d'initialiser le client Supabase : ${err.message}`,
        'INIT_ECHEC'
      );
    }
  }

  // ============================================================
  // LECTURE
  // ============================================================

  async obtenirTous(collection, options = {}) {
    await this._assurerinitialise();

    let requete = this._client.from(collection).select('*', { count: 'exact' });

    // Filtres
    if (options.filtres) {
      for (const [champ, valeur] of Object.entries(options.filtres)) {
        if (valeur === null || valeur === undefined) continue;
        if (Array.isArray(valeur)) {
          requete = requete.in(champ, valeur);
        } else {
          requete = requete.eq(champ, valeur);
        }
      }
    }

    // Recherche textuelle
    if (options.recherche && options.champsRecherche?.length > 0) {
      const conditions = options.champsRecherche
        .map(champ => `${champ}.ilike.%${options.recherche}%`)
        .join(',');
      requete = requete.or(conditions);
    }

    // Tri
    const champTri = options.tri || 'cree_le';
    const ordreAsc = options.ordre === 'asc';
    requete = requete.order(champTri, { ascending: ordreAsc });

    // Pagination
    const parPage = options.parPage || 0;
    const page    = Math.max(1, options.page || 1);

    if (parPage > 0) {
      const debut = (page - 1) * parPage;
      requete = requete.range(debut, debut + parPage - 1);
    } else if (options.limite && options.limite > 0) {
      requete = requete.limit(options.limite);
    }

    const { data, error, count } = await requete;

    if (error) this._lancerErreur(error);

    return {
      donnees: data || [],
      total:   count || 0,
      page,
    };
  }

  async obtenirParId(collection, id) {
    await this._assurerinitialise();

    const { data, error } = await this._client
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ErreurNonTrouve(collection, id);
      this._lancerErreur(error);
    }

    return data;
  }

  async obtenirParChamp(collection, champ, valeur) {
    await this._assurerinitialise();

    const { data, error } = await this._client
      .from(collection)
      .select('*')
      .eq(champ, valeur)
      .maybeSingle();

    if (error) this._lancerErreur(error);
    return data;
  }

  // ============================================================
  // ÉCRITURE
  // ============================================================

  async creer(collection, donnees) {
    await this._assurerinitialise();

    const { data, error } = await this._client
      .from(collection)
      .insert([{
        ...donnees,
        cree_le:    donnees.cree_le    || new Date().toISOString(),
        modifie_le: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) this._lancerErreur(error);
    return data;
  }

  async metAJour(collection, id, donnees) {
    await this._assurerinitialise();

    const { data, error } = await this._client
      .from(collection)
      .update({
        ...donnees,
        modifie_le: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ErreurNonTrouve(collection, id);
      this._lancerErreur(error);
    }

    return data;
  }

  async supprimer(collection, id) {
    await this._assurerinitialise();

    const { error } = await this._client
      .from(collection)
      .delete()
      .eq('id', id);

    if (error) this._lancerErreur(error);
    return true;
  }

  // ============================================================
  // RECHERCHE
  // ============================================================

  async rechercher(collection, terme, champs = []) {
    await this._assurerinitialise();

    let requete = this._client.from(collection).select('*');

    if (champs.length > 0) {
      const conditions = champs
        .map(champ => `${champ}.ilike.%${terme}%`)
        .join(',');
      requete = requete.or(conditions);
    } else {
      // Recherche full-text sur toutes les colonnes textuelles
      requete = requete.textSearch('fts', terme, {
        type: 'websearch',
        config: 'french',
      });
    }

    const { data, error } = await requete.limit(50);
    if (error) this._lancerErreur(error);
    return data || [];
  }

  async compter(collection, filtres = {}) {
    await this._assurerinitialise();

    let requete = this._client
      .from(collection)
      .select('*', { count: 'exact', head: true });

    for (const [champ, valeur] of Object.entries(filtres)) {
      if (valeur !== null && valeur !== undefined) {
        requete = requete.eq(champ, valeur);
      }
    }

    const { count, error } = await requete;
    if (error) this._lancerErreur(error);
    return count || 0;
  }

  // ============================================================
  // OPÉRATIONS EN LOT
  // ============================================================

  async lot(operations) {
    // Supabase ne supporte pas les transactions côté client
    // On exécute séquentiellement avec rollback manuel si nécessaire
    const resultats = [];
    const effectuees = [];

    try {
      for (const op of operations) {
        let resultat;
        switch (op.operation) {
          case 'creer':
            resultat = await this.creer(op.collection, op.donnees);
            effectuees.push({ type: 'supprimer', collection: op.collection, id: resultat.id });
            break;
          case 'metAJour':
            const ancien = await this.obtenirParId(op.collection, op.id);
            resultat = await this.metAJour(op.collection, op.id, op.donnees);
            effectuees.push({ type: 'metAJour', collection: op.collection, id: op.id, donnees: ancien });
            break;
          case 'supprimer':
            resultat = await this.supprimer(op.collection, op.id);
            break;
          default:
            throw new ErreurStockage(`Opération inconnue : ${op.operation}`, 'OP_INCONNUE');
        }
        resultats.push(resultat);
      }
    } catch (err) {
      // Tentative de rollback des opérations effectuées
      console.error('[AdaptateurSupabase] Erreur en lot, tentative de rollback…');
      for (const op of effectuees.reverse()) {
        try {
          if (op.type === 'supprimer') await this.supprimer(op.collection, op.id);
          if (op.type === 'metAJour') await this.metAJour(op.collection, op.id, op.donnees);
        } catch (_) { /* rollback best-effort */ }
      }
      throw err;
    }

    return resultats;
  }

  // ============================================================
  // GESTION DES FICHIERS — SUPABASE STORAGE
  // ============================================================

  async uploaderFichier(fichier, chemin, options = {}) {
    await this._assurerinitialise();

    const bucket = options.bucket || BUCKETS.MEDIAS;

    const { data, error } = await this._client.storage
      .from(bucket)
      .upload(chemin, fichier, {
        cacheControl: '3600',
        upsert:       options.ecraser || false,
        contentType:  fichier.type,
      });

    if (error) this._lancerErreur(error);

    const url = this.obtenirUrlFichier(chemin, bucket);
    return { url, chemin: data.path };
  }

  async supprimerFichier(chemin, bucket = BUCKETS.MEDIAS) {
    await this._assurerinitialise();

    const { error } = await this._client.storage
      .from(bucket)
      .remove([chemin]);

    if (error) this._lancerErreur(error);
    return true;
  }

  obtenirUrlFichier(chemin, bucket = BUCKETS.MEDIAS) {
    const { data } = this._client.storage
      .from(bucket)
      .getPublicUrl(chemin);
    return data?.publicUrl || '';
  }

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================

  /**
   * Connexion par email et mot de passe
   * @param {string} email 
   * @param {string} motDePasse 
   * @returns {Promise<Object>} Session utilisateur
   */
  async seConnecter(email, motDePasse) {
    await this._assurerinitialise();

    const { data, error } = await this._client.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      throw new ErreurAutorisation(
        error.message === 'Invalid login credentials'
          ? 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
          : error.message
      );
    }

    return data;
  }

  /**
   * Déconnexion
   */
  async seDeconnecter() {
    await this._assurerinitialise();
    const { error } = await this._client.auth.signOut();
    if (error) this._lancerErreur(error);
  }

  /**
   * Récupère la session courante
   * @returns {Promise<Object|null>}
   */
  async obtenirSession() {
    await this._assurerinitialise();
    const { data: { session } } = await this._client.auth.getSession();
    return session;
  }

  /**
   * Écoute les changements d'état d'authentification
   * @param {Function} rappel
   */
  ecouterAuthentification(rappel) {
    if (!this._client) return;
    this._client.auth.onAuthStateChange((evenement, session) => {
      rappel(evenement, session);
    });
  }

  // ============================================================
  // VÉRIFICATION
  // ============================================================

  async verifierConnexion() {
    try {
      await this._assurerinitialise();
      const { error } = await this._client.from('parametres').select('id').limit(1);
      return !error;
    } catch (_) {
      return false;
    }
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  async _assurerinitialise() {
    if (!this._initialise) await this.initialiser();
  }

  /**
   * Transforme une erreur Supabase en ErreurStockage
   * @param {Object} error - Erreur Supabase
   */
  _lancerErreur(error) {
    const code = error.code || 'SUPABASE_ERREUR';
    const message = error.message || 'Erreur Supabase inconnue';

    if (error.code === '42501' || error.message?.includes('JWT')) {
      throw new ErreurAutorisation(message);
    }

    if (error.code === '23505') {
      throw new ErreurValidation(`Doublon : ${message}`, { doublon: true });
    }

    throw new ErreurStockage(message, code, error);
  }
}
