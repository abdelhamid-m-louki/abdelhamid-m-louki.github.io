/**
 * ASSISTANT IA DE CONTENU
 * Portfolio Éditorial — Génération et amélioration de contenu
 *
 * Architecture modulaire multi-fournisseur :
 * - Gemini 2.5 Flash (fournisseur par défaut)
 * - OpenAI GPT-4o
 * - Claude API (optionnel)
 *
 * Toutes les sorties sont en français.
 * Les clés API ne transitent JAMAIS par le navigateur.
 * Proxy Vercel obligatoire : api/ia.js
 *
 * Fonctionnalités :
 * - Réécriture de texte
 * - Résumé d'article
 * - Génération de métadonnées SEO
 * - Génération de tags
 * - Amélioration de lisibilité
 * - Humanisation de contenu
 * - Génération de titres alternatifs
 */

'use strict';

import stockage from '../storage/storage-manager.js';

/** Point d'entrée du proxy Vercel — masque les clés API */
const PROXY_URL = `${(window.CONFIG && window.CONFIG.API_BASE) || ''}/api/ia`;

/** Fournisseurs disponibles */
export const FOURNISSEURS = Object.freeze({
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude',
});

/** Actions disponibles */
export const ACTIONS = Object.freeze({
  REECRIRE:         'reecrire',
  RESUMER:          'resumer',
  AMELIORER:        'ameliorer',
  HUMANISER:        'humaniser',
  GENERER_TITRES:   'generer_titres',
  GENERER_META:     'generer_meta',
  GENERER_TAGS:     'generer_tags',
  GENERER_EXTRAIT:  'generer_extrait',
  CORRIGER:         'corriger',
  SIMPLIFIER:       'simplifier',
});

class AssistantIA {
  constructor() {
    /** @type {string} Fournisseur actif */
    this._fournisseur = FOURNISSEURS.GEMINI;
    /** @type {boolean} Disponibilité du proxy */
    this._proxyDisponible = null;
    /** @type {AbortController|null} Requête en cours */
    this._controleur = null;
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Définit le fournisseur IA actif
   * @param {string} fournisseur 
   */
  definirFournisseur(fournisseur) {
    if (!Object.values(FOURNISSEURS).includes(fournisseur)) {
      throw new Error(`Fournisseur IA inconnu : ${fournisseur}`);
    }
    this._fournisseur = fournisseur;
  }

  /** @returns {string} Fournisseur actif */
  get fournisseur() { return this._fournisseur; }

  // ============================================================
  // ACTIONS PRINCIPALES
  // ============================================================

  /**
   * Réécrit un texte
   * @param {string} texte 
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  async reecrire(texte, options = {}) {
    return this._executer(ACTIONS.REECRIRE, texte, options);
  }

  /**
   * Résume un texte
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async resumer(texte) {
    return this._executer(ACTIONS.RESUMER, texte);
  }

  /**
   * Améliore le style d'un texte
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async ameliorer(texte) {
    return this._executer(ACTIONS.AMELIORER, texte);
  }

  /**
   * Humanise un texte (réduit l'aspect IA)
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async humaniser(texte) {
    return this._executer(ACTIONS.HUMANISER, texte);
  }

  /**
   * Génère des titres alternatifs
   * @param {string} texte 
   * @returns {Promise<string[]>}
   */
  async genererTitres(texte) {
    const resultat = await this._executer(ACTIONS.GENERER_TITRES, texte);
    return this._parseJSON(resultat, []);
  }

  /**
   * Génère des métadonnées SEO
   * @param {string} texte 
   * @returns {Promise<{titre: string, description: string, motsClés: string[]}>}
   */
  async genererMeta(texte) {
    const resultat = await this._executer(ACTIONS.GENERER_META, texte);
    return this._parseJSON(resultat, { titre: '', description: '', motsClés: [] });
  }

  /**
   * Génère des tags
   * @param {string} texte 
   * @returns {Promise<string[]>}
   */
  async genererTags(texte) {
    const resultat = await this._executer(ACTIONS.GENERER_TAGS, texte);
    return this._parseJSON(resultat, []);
  }

  /**
   * Génère un extrait
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async genererExtrait(texte) {
    return this._executer(ACTIONS.GENERER_EXTRAIT, texte);
  }

  /**
   * Corrige l'orthographe et la typographie
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async corriger(texte) {
    return this._executer(ACTIONS.CORRIGER, texte);
  }

  /**
   * Simplifie un texte complexe
   * @param {string} texte 
   * @returns {Promise<string>}
   */
  async simplifier(texte) {
    return this._executer(ACTIONS.SIMPLIFIER, texte);
  }

  /**
   * Annule la requête IA en cours
   */
  annuler() {
    this._controleur?.abort();
    this._controleur = null;
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Vérifie la disponibilité du proxy IA
   * @returns {Promise<boolean>}
   */
  async verifierDisponibilite() {
    if (this._proxyDisponible !== null) return this._proxyDisponible;

    try {
      const reponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
        signal: AbortSignal.timeout(3000),
      });
      this._proxyDisponible = reponse.ok;
    } catch (_) {
      this._proxyDisponible = false;
    }

    return this._proxyDisponible;
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  /**
   * Exécute une action IA via le proxy
   * @param {string} action 
   * @param {string} texte 
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  async _executer(action, texte, options = {}) {
    if (!texte?.trim()) {
      throw new Error('Le texte ne peut pas être vide.');
    }

    if (texte.length > 50000) {
      throw new Error('Le texte dépasse la longueur maximale (50 000 caractères).');
    }

    // Annule une requête en cours
    this.annuler();
    this._controleur = new AbortController();

    const corps = {
      action,
      texte:        texte.trim(),
      fournisseur:  this._fournisseur,
      options,
    };

    try {
      const jeton = await stockage.obtenirJeton();
      const reponse = await fetch(PROXY_URL, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        },
        body:   JSON.stringify(corps),
        signal: this._controleur.signal,
      });

      if (!reponse.ok) {
        const erreurTexte = await reponse.text().catch(() => '');
        let messageErreur = `Erreur ${reponse.status}`;

        try {
          const erreurJson = JSON.parse(erreurTexte);
          messageErreur = erreurJson.message || erreurJson.erreur || messageErreur;
        } catch (_) {
          // Réponse non-JSON
        }

        throw new Error(`Erreur IA : ${messageErreur}`);
      }

      const donnees = await reponse.json();

      if (!donnees.resultat && !donnees.contenu) {
        throw new Error('Le proxy IA n\'a pas retourné de résultat.');
      }

      return donnees.resultat || donnees.contenu;

    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Requête IA annulée.');
      }
      throw err;
    } finally {
      this._controleur = null;
    }
  }

  /**
   * Parse du JSON depuis une réponse IA (tolère les erreurs)
   * @param {string} texte 
   * @param {*} defaut - Valeur par défaut si parse échoue
   * @returns {*}
   */
  _parseJSON(texte, defaut) {
    if (!texte) return defaut;

    // Extrait le JSON si entouré de texte
    const match = texte.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    const json = match ? match[1] : texte.trim();

    try {
      return JSON.parse(json);
    } catch (_) {
      console.warn('[AssistantIA] Impossible de parser la réponse JSON :', texte);
      return defaut;
    }
  }
}

// Singleton exporté
const ia = new AssistantIA();
export default ia;
