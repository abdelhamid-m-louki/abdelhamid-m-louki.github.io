/**
 * SYSTÈME D'AUTHENTIFICATION
 * Portfolio Éditorial — Gestion des sessions et protection des routes
 *
 * Fonctionnalités :
 * - Connexion / déconnexion via Supabase ou JSON local
 * - Sessions persistantes avec vérification
 * - Protection des routes administrateur
 * - Vérification des rôles
 * - Événements d'état d'authentification
 *
 * Architecture : Ce module ne manipule pas le DOM directement.
 * Il émet des événements que les composants UI écoutent.
 */

'use strict';

import stockage from '../storage/storage-manager.js';
import { ErreurValidation, ErreurAutorisation } from '../storage/interfaces.js';

/** Rôles autorisés */
const ROLES = Object.freeze({
  ADMIN:    'admin',
  EDITEUR:  'editeur',
  LECTEUR:  'lecteur',
});

/** Hiérarchie des rôles pour les comparaisons de niveau */
const NIVEAU_ROLE = Object.freeze({
  lecteur: 1,
  editeur: 2,
  admin:   3,
});

/** Événements émis */
const EVENEMENTS = Object.freeze({
  CONNECTE:      'auth:connecte',
  DECONNECTE:    'auth:deconnecte',
  SESSION_EXPIREE: 'auth:session-expiree',
  ERREUR:        'auth:erreur',
  PROFIL_MODIFIE: 'auth:profil-modifie',
});

class GestionnaireAuthentification {
  constructor() {
    /** @type {Object|null} Utilisateur courant */
    this._utilisateur = null;
    /** @type {Object|null} Session courante */
    this._session     = null;
    /** @type {boolean} Initialisation effectuée */
    this._initialise  = false;
    /** @type {number|null} Timer de vérification d'expiration */
    this._timerExpiration = null;
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise le gestionnaire et vérifie la session existante.
   * À appeler au chargement de chaque page.
   */
  async initialiser() {
    if (this._initialise) return;
    this._initialise = true;

    try {
      const session = await stockage.obtenirSession();
      if (session) {
        await this._etablirSession(session);
      }
    } catch (_) {
      this._reinitialiserEtat();
    }

    // Écoute les changements d'état Supabase
    stockage.ecouterAuthentification(async (evenement, session) => {
      if (evenement === 'SIGNED_IN' && session) {
        await this._etablirSession(session);
      } else if (evenement === 'SIGNED_OUT') {
        this._reinitialiserEtat();
        this._emettre(EVENEMENTS.DECONNECTE, {});
      } else if (evenement === 'TOKEN_REFRESHED' && session) {
        this._session = session;
      }
    });
  }

  // ============================================================
  // CONNEXION / DÉCONNEXION
  // ============================================================

  /**
   * Connecte un utilisateur
   * @param {string} email
   * @param {string} motDePasse
   * @returns {Promise<Object>} Utilisateur connecté
   */
  async seConnecter(email, motDePasse) {
    this._validerIdentifiants(email, motDePasse);

    try {
      const resultat = await stockage.seConnecter(email, motDePasse);
      await this._etablirSession(resultat.session);
      return this._utilisateur;
    } catch (err) {
      this._emettre(EVENEMENTS.ERREUR, { message: err.message });
      throw err;
    }
  }

  /**
   * Déconnecte l'utilisateur courant
   */
  async seDeconnecter() {
    try {
      await stockage.seDeconnecter();
    } finally {
      this._reinitialiserEtat();
      this._emettre(EVENEMENTS.DECONNECTE, {});
      // Redirige vers la page de connexion
      window.location.href = '/admin/connexion.html';
    }
  }

  // ============================================================
  // VÉRIFICATIONS
  // ============================================================

  /** @returns {boolean} L'utilisateur est connecté */
  get estConnecte() {
    return this._utilisateur !== null && this._session !== null;
  }

  /** @returns {Object|null} Utilisateur courant */
  get utilisateur() {
    return this._utilisateur ? { ...this._utilisateur } : null;
  }

  /** @returns {string|null} Rôle de l'utilisateur courant */
  get role() {
    return this._utilisateur?.role || null;
  }

  /**
   * Vérifie si l'utilisateur possède un rôle minimum
   * (hiérarchie : lecteur < editeur < admin)
   * @param {string} roleMinimum
   * @returns {boolean}
   */
  aLeRole(roleMinimum) {
    if (!this.estConnecte) return false;
    const niveauActuel = NIVEAU_ROLE[this._utilisateur?.role];
    const niveauRequis = NIVEAU_ROLE[roleMinimum];
    if (typeof niveauActuel !== 'number' || typeof niveauRequis !== 'number') {
      return false;
    }
    return niveauActuel >= niveauRequis;
  }

  /** @returns {boolean} Utilisateur est administrateur */
  get estAdmin() {
    return this.aLeRole(ROLES.ADMIN);
  }

  /** @returns {boolean} Utilisateur est éditeur ou plus */
  get estEditeur() {
    return this.aLeRole(ROLES.EDITEUR);
  }

  // ============================================================
  // PROTECTION DES ROUTES
  // ============================================================

  /**
   * Protège une page : redirige si non connecté
   * @param {string} [roleRequis] - Rôle minimum requis
   * @param {string} [redirection] - URL de redirection si non autorisé
   */
  async protegerRoute(roleRequis = null, redirection = '/admin/connexion.html') {
    await this.initialiser();

    if (!this.estConnecte) {
      // Mémorise la page demandée pour redirection après connexion
      sessionStorage.setItem(
        'auth_retour',
        encodeURIComponent(window.location.href)
      );
      window.location.href = redirection;
      return false;
    }

    if (roleRequis && !this.aLeRole(roleRequis)) {
      window.location.href = '/admin/non-autorise.html';
      return false;
    }

    return true;
  }

  /**
   * Redirige si déjà connecté (pour la page de connexion)
   * @param {string} [destination] - URL cible si déjà connecté
   */
  async redirigerSiConnecte(destination = '/admin/tableau-de-bord.html') {
    await this.initialiser();

    if (this.estConnecte) {
      const retour = sessionStorage.getItem('auth_retour');
      if (retour) {
        sessionStorage.removeItem('auth_retour');
        window.location.href = decodeURIComponent(retour);
      } else {
        window.location.href = destination;
      }
      return true;
    }
    return false;
  }

  // ============================================================
  // MIDDLEWARE — À UTILISER COMME DÉCORATEUR
  // ============================================================

  /**
   * Crée un garde de route sous forme de middleware
   * Usage :
   *   document.addEventListener('DOMContentLoaded', auth.garderoute(ROLES.ADMIN));
   * @param {string} [roleRequis]
   * @returns {Function}
   */
  gardeRoute(roleRequis = null) {
    return async () => {
      await this.protegerRoute(roleRequis);
    };
  }

  // ============================================================
  // RÉINITIALISATION DU MOT DE PASSE
  // ============================================================

  /**
   * Demande un lien de réinitialisation de mot de passe
   * @param {string} email
   */
  async reinitialiserMotDePasse(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Adresse email invalide.');
    }
    // Initialise le stockage avant toute vérification de mode
    await stockage.pret();
    await stockage.demanderReinitialisation(
      email,
      `${window.location.origin}/admin/nouveau-mot-de-passe.html`
    );
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  /**
   * Établit une session à partir des données reçues.
   * Fail-closed : sans profil utilisateur en base (ou compte désactivé),
   * la session est refusée — aucun accès par défaut à un rôle élevé.
   * @param {Object} session 
   */
  async _etablirSession(session) {
    if (!session) return;

    this._session = session;

    // Extrait l'utilisateur selon le format (Supabase vs local)
    const utilisateurBrut = session.user || session.utilisateur;
    if (!utilisateurBrut) {
      this._reinitialiserEtat();
      return;
    }

    // Le profil en base fait foi : rôle, nom et état du compte
    let profil = null;
    try {
      profil = await stockage.obtenirParChamp(
        'utilisateurs',
        'id',
        utilisateurBrut.id
      );
    } catch (_) {
      profil = null;
    }

    if (!profil) {
      this._reinitialiserEtat();
      throw new ErreurAutorisation(
        'Profil introuvable. Votre accès est refusé — contactez l\'administrateur.'
      );
    }
    if (profil.actif === false) {
      this._reinitialiserEtat();
      throw new ErreurAutorisation(
        'Compte désactivé. Votre accès est refusé — contactez l\'administrateur.'
      );
    }

    this._utilisateur = {
      id:    profil.id || utilisateurBrut.id,
      email: profil.email || utilisateurBrut.email,
      role:  profil.role || ROLES.LECTEUR, // défaut minimaliste, jamais éditeur/admin
      nom:   profil.nom || profil.email || utilisateurBrut.email,
    };

    this._planifierVerificationExpiration(session);
    this._emettre(EVENEMENTS.CONNECTE, { utilisateur: this._utilisateur });
  }

  /**
   * Planifie la vérification d'expiration de session
   * @param {Object} session 
   */
  _planifierVerificationExpiration(session) {
    if (this._timerExpiration) clearTimeout(this._timerExpiration);

    const expireA = session.expires_at
      ? new Date(session.expires_at * 1000)
      : session.expire_le
        ? new Date(session.expire_le)
        : null;

    if (!expireA) return;

    const maintenant   = Date.now();
    const dureeRestante = expireA.getTime() - maintenant;
    const avertissementAt = dureeRestante - (5 * 60 * 1000); // 5 min avant

    if (avertissementAt > 0) {
      this._timerExpiration = setTimeout(() => {
        this._emettre(EVENEMENTS.SESSION_EXPIREE, {});
      }, avertissementAt);
    }
  }

  /**
   * Réinitialise l'état interne
   */
  _reinitialiserEtat() {
    this._utilisateur = null;
    this._session     = null;
    if (this._timerExpiration) {
      clearTimeout(this._timerExpiration);
      this._timerExpiration = null;
    }
  }

  /**
   * Valide les identifiants de connexion
   * @param {string} email 
   * @param {string} motDePasse 
   */
  _validerIdentifiants(email, motDePasse) {
    const erreurs = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      erreurs.email = 'Adresse email invalide.';
    }
    if (!motDePasse || motDePasse.length < 6) {
      erreurs.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (Object.keys(erreurs).length > 0) {
      throw new ErreurValidation('Identifiants invalides.', erreurs);
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
const auth = new GestionnaireAuthentification();
export default auth;
export { ROLES, EVENEMENTS };
