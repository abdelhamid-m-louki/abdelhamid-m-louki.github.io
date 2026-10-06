/**
 * GESTIONNAIRE DE STOCKAGE — FAÇADE CENTRALE
 * Portfolio Éditorial
 *
 * Point d'entrée UNIQUE pour toutes les opérations de données.
 * Le frontend n'appelle jamais Supabase directement.
 *
 * Architecture :
 *   Page → storage-manager.js → AdaptateurSupabase (backend unique)
 *
 * Supabase est le seul backend : toute erreur de connexion est
 * remontée, aucune bascule locale n'existe.
 * Émet des événements DOM pour les notifications UI.
 *
 * @example
 * import stockage from './storage/storage-manager.js';
 * const { donnees } = await stockage.obtenirTous('articles', { limite: 10 });
 */

'use strict';

import { AdaptateurSupabase }   from './supabase.adapter.js';
import { ErreurStockage, ErreurAutorisation } from './interfaces.js';

/** Configuration lue depuis window.CONFIG (injecté dans le HTML) */
const CONFIG_GLOBALE = window.CONFIG || {};

/** Mode de fonctionnement */
const MODE = Object.freeze({
  SUPABASE: 'supabase',
});

class GestionnaireStockage {
  constructor() {
    this._adaptateur = null;
    this._mode       = null;
    this._pret       = false;
    this._initialisant = null; // Promise de démarrage unique
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise le gestionnaire.
   * Appelé automatiquement au premier appel.
   * Singleton : un seul appel possible.
   */
  async _demarrer() {
    if (this._pret) return;
    if (this._initialisant) return this._initialisant;

    this._initialisant = this._choisirAdaptateur();
    await this._initialisant;
    this._pret = true;
  }

  async _choisirAdaptateur() {
    const urlSupabase = CONFIG_GLOBALE.SUPABASE_URL;
    const cleSupabase = CONFIG_GLOBALE.SUPABASE_ANON_KEY;

    if (!urlSupabase || !cleSupabase) {
      throw new ErreurStockage(
        'Supabase non configuré : renseignez SUPABASE_URL et SUPABASE_ANON_KEY dans config.js.',
        'CONFIGURATION_MANQUANTE'
      );
    }

    const adaptateur = new AdaptateurSupabase({ url: urlSupabase, cle: cleSupabase });
    await adaptateur.initialiser();
    const connecte = await adaptateur.verifierConnexion();
    if (!connecte) {
      throw new ErreurStockage(
        'Connexion Supabase impossible : vérifiez la configuration.',
        'CONNEXION_ECHEC'
      );
    }

    this._adaptateur = adaptateur;
    this._mode       = MODE.SUPABASE;
    this._emettre('stockage:mode', { mode: MODE.SUPABASE });
    console.info('[Stockage] Mode : Supabase PostgreSQL');
  }

  // ============================================================
  // API PUBLIQUE — OPÉRATIONS CRUD
  // ============================================================

  /**
   * Récupère plusieurs enregistrements
   * @param {string} collection 
   * @param {Object} [options]
   * @returns {Promise<{donnees: Array, total: number, page: number}>}
   */
  async obtenirTous(collection, options = {}) {
    await this._demarrer();
    return this._executer('obtenirTous', collection, options);
  }

  /**
   * Récupère un enregistrement par son identifiant
   * @param {string} collection 
   * @param {string|number} id 
   * @returns {Promise<Object>}
   */
  async obtenirParId(collection, id) {
    await this._demarrer();
    return this._executer('obtenirParId', collection, id);
  }

  /**
   * Récupère un enregistrement par valeur de champ
   * @param {string} collection 
   * @param {string} champ 
   * @param {*} valeur 
   * @returns {Promise<Object|null>}
   */
  async obtenirParChamp(collection, champ, valeur) {
    await this._demarrer();
    return this._executer('obtenirParChamp', collection, champ, valeur);
  }

  /**
   * Crée un nouvel enregistrement
   * @param {string} collection 
   * @param {Object} donnees 
   * @returns {Promise<Object>}
   */
  async creer(collection, donnees) {
    await this._demarrer();
    const resultat = await this._executer('creer', collection, donnees);
    this._emettre('stockage:cree', { collection, donnees: resultat });
    return resultat;
  }

  /**
   * Met à jour un enregistrement existant
   * @param {string} collection 
   * @param {string|number} id 
   * @param {Object} donnees 
   * @returns {Promise<Object>}
   */
  async metAJour(collection, id, donnees) {
    await this._demarrer();
    const resultat = await this._executer('metAJour', collection, id, donnees);
    this._emettre('stockage:modifie', { collection, id, donnees: resultat });
    return resultat;
  }

  /**
   * Supprime un enregistrement
   * @param {string} collection 
   * @param {string|number} id 
   * @returns {Promise<boolean>}
   */
  async supprimer(collection, id) {
    await this._demarrer();
    const resultat = await this._executer('supprimer', collection, id);
    this._emettre('stockage:supprime', { collection, id });
    return resultat;
  }

  /**
   * Recherche textuelle
   * @param {string} collection 
   * @param {string} terme 
   * @param {string[]} champs 
   * @returns {Promise<Array>}
   */
  async rechercher(collection, terme, champs = []) {
    await this._demarrer();
    return this._executer('rechercher', collection, terme, champs);
  }

  /**
   * Compte les enregistrements
   * @param {string} collection 
   * @param {Object} [filtres]
   * @returns {Promise<number>}
   */
  async compter(collection, filtres = {}) {
    await this._demarrer();
    return this._executer('compter', collection, filtres);
  }

  /**
   * Opérations en lot
   * @param {Array} operations 
   * @returns {Promise<Array>}
   */
  async lot(operations) {
    await this._demarrer();
    return this._executer('lot', operations);
  }

  // ============================================================
  // API FICHIERS
  // ============================================================

  /**
   * Upload un fichier vers le stockage
   * @param {File} fichier 
   * @param {string} chemin 
   * @param {Object} [options]
   * @returns {Promise<{url: string, chemin: string}>}
   */
  async uploaderFichier(fichier, chemin, options = {}) {
    await this._demarrer();
    const resultat = await this._executer('uploaderFichier', fichier, chemin, options);
    this._emettre('stockage:fichier-uploade', { chemin, url: resultat.url });
    return resultat;
  }

  /**
   * Supprime un fichier
   * @param {string} chemin 
   * @returns {Promise<boolean>}
   */
  async supprimerFichier(chemin) {
    await this._demarrer();
    return this._executer('supprimerFichier', chemin);
  }

  /**
   * Retourne l'URL publique d'un fichier
   * @param {string} chemin 
   * @returns {string}
   */
  obtenirUrlFichier(chemin) {
    if (!this._adaptateur) return chemin;
    return this._adaptateur.obtenirUrlFichier(chemin);
  }

  // ============================================================
  // AUTHENTIFICATION (délégation à l'adaptateur Supabase)
  // ============================================================

  /**
   * Connexion par email / mot de passe
   * @param {string} email 
   * @param {string} motDePasse 
   * @returns {Promise<Object>}
   */
  async seConnecter(email, motDePasse) {
    await this._demarrer();
    return this._adaptateur.seConnecter(email, motDePasse);
  }

  /**
   * Récupère l'utilisateur Auth courant (flux de réinitialisation)
   * @returns {Promise<Object|null>}
   */
  async obtenirUtilisateurAuth() {
    await this._demarrer();
    return this._adaptateur.obtenirUtilisateurAuth();
  }

  /**
   * Demande un lien de réinitialisation de mot de passe (Supabase Auth)
   * @param {string} email
   * @param {string} [redirection] - URL de retour après clic sur le lien
   */
  async demanderReinitialisation(email, redirection = '') {
    await this._demarrer();
    if (!this._adaptateur.demanderReinitialisation) {
      throw new ErreurAutorisation('Réinitialisation indisponible.');
    }
    return this._adaptateur.demanderReinitialisation(email, redirection);
  }

  /**
   * Jeton d'accès Supabase courant (pour les appels API authentifiés)
   * @returns {Promise<string|null>}
   */
  async obtenirJeton() {
    await this._demarrer();
    if (!this._adaptateur._obtenirJeton) return null;
    return this._adaptateur._obtenirJeton();
  }

  /**
   * Force l'initialisation du gestionnaire
   * @returns {Promise<boolean>}
   */
  async pret() {
    await this._demarrer();
    return true;
  }

  /**
   * Met à jour le mot de passe (après réinitialisation)
   * @param {string} motDePasse
   */
  async mettreAJourMotDePasse(motDePasse) {
    await this._demarrer();
    return this._adaptateur.mettreAJourMotDePasse(motDePasse);
  }

  async seDeconnecter() {
    await this._demarrer();
    return this._adaptateur.seDeconnecter();
  }

  async obtenirSession() {
    await this._demarrer();
    return this._adaptateur.obtenirSession();
  }

  ecouterAuthentification(rappel) {
    if (!this._adaptateur) {
      console.warn('[Stockage] Impossible d\'écouter l\'auth avant initialisation.');
      return;
    }
    this._adaptateur.ecouterAuthentification(rappel);
  }

  // ============================================================
  // INFORMATIONS
  // ============================================================

  /** @returns {string} Mode actuel ('supabase') */
  get mode() { return this._mode; }

  /** @returns {boolean} Utilise Supabase */
  get estSupabase() { return this._mode === MODE.SUPABASE; }

  /** @returns {boolean} Gestionnaire prêt */
  get estPret() { return this._pret; }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  /**
   * Exécute une méthode sur l'adaptateur avec gestion d'erreur
   * @param {string} methode 
   * @param {...*} args 
   */
  async _executer(methode, ...args) {
    try {
      return await this._adaptateur[methode](...args);
    } catch (err) {
      // Enrichit l'erreur avec le contexte
      if (!(err instanceof ErreurStockage)) {
        throw new ErreurStockage(
          `Erreur dans ${methode}() : ${err.message}`,
          'ERREUR_INTERNE',
          err
        );
      }
      throw err;
    }
  }

  /**
   * Émet un événement DOM
   * @param {string} nom 
   * @param {Object} detail 
   */
  _emettre(nom, detail) {
    document.dispatchEvent(new CustomEvent(nom, { detail, bubbles: true }));
  }
}

// Singleton exporté
const stockage = new GestionnaireStockage();
export default stockage;

// Export des collections pour commodité
export { COLLECTIONS } from './interfaces.js';
