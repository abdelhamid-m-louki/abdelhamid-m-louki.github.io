/**
 * INTERFACES DE STOCKAGE
 * Portfolio Éditorial — Contrats d'adaptateur
 *
 * Ce fichier définit les interfaces (contrats) que tous
 * les adaptateurs de stockage doivent respecter.
 * 
 * Principe : le frontend ne connaît jamais le backend.
 * Tous les appels passent par storage-manager.js.
 * 
 * Migration future : changer l'adaptateur suffit.
 * Aucune modification du code frontend requise.
 */

'use strict';

/**
 * Interface abstraite de stockage.
 * Chaque adaptateur DOIT implémenter ces méthodes.
 *
 * @abstract
 */
export class InterfaceStockage {
  
  /**
   * Récupère tous les enregistrements d'une collection
   * @param {string} collection - Nom de la collection / table
   * @param {Object} options - Filtres, tri, pagination
   * @param {Object} [options.filtres] - Conditions de filtre
   * @param {string} [options.tri] - Champ de tri
   * @param {string} [options.ordre] - 'asc' | 'desc'
   * @param {number} [options.limite] - Nombre max de résultats
   * @param {number} [options.page] - Numéro de page (base 1)
   * @param {number} [options.parPage] - Éléments par page
   * @returns {Promise<{donnees: Array, total: number, page: number}>}
   */
  async obtenirTous(collection, options = {}) {
    throw new Error('obtenirTous() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Récupère un enregistrement unique par identifiant
   * @param {string} collection 
   * @param {string|number} id 
   * @returns {Promise<Object|null>}
   */
  async obtenirParId(collection, id) {
    throw new Error('obtenirParId() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Récupère un enregistrement unique par champ
   * @param {string} collection 
   * @param {string} champ - Nom du champ
   * @param {*} valeur - Valeur recherchée
   * @returns {Promise<Object|null>}
   */
  async obtenirParChamp(collection, champ, valeur) {
    throw new Error('obtenirParChamp() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Crée un nouvel enregistrement
   * @param {string} collection 
   * @param {Object} donnees 
   * @returns {Promise<Object>} - Enregistrement créé
   */
  async creer(collection, donnees) {
    throw new Error('creer() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Met à jour un enregistrement existant
   * @param {string} collection 
   * @param {string|number} id 
   * @param {Object} donnees - Champs à mettre à jour
   * @returns {Promise<Object>} - Enregistrement mis à jour
   */
  async metAJour(collection, id, donnees) {
    throw new Error('metAJour() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Supprime un enregistrement
   * @param {string} collection 
   * @param {string|number} id 
   * @returns {Promise<boolean>}
   */
  async supprimer(collection, id) {
    throw new Error('supprimer() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Recherche en texte libre
   * @param {string} collection 
   * @param {string} terme - Terme de recherche
   * @param {string[]} champs - Champs dans lesquels chercher
   * @returns {Promise<Array>}
   */
  async rechercher(collection, terme, champs = []) {
    throw new Error('rechercher() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Compte les enregistrements
   * @param {string} collection 
   * @param {Object} [filtres]
   * @returns {Promise<number>}
   */
  async compter(collection, filtres = {}) {
    throw new Error('compter() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Opérations en lot
   * @param {Array<{operation: string, collection: string, donnees: Object}>} operations
   * @returns {Promise<Array>}
   */
  async lot(operations) {
    throw new Error('lot() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Upload d'un fichier
   * @param {File} fichier 
   * @param {string} chemin - Chemin de destination dans le stockage
   * @param {Object} [options]
   * @returns {Promise<{url: string, chemin: string}>}
   */
  async uploaderFichier(fichier, chemin, options = {}) {
    throw new Error('uploaderFichier() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Supprime un fichier du stockage
   * @param {string} chemin 
   * @returns {Promise<boolean>}
   */
  async supprimerFichier(chemin) {
    throw new Error('supprimerFichier() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Obtient l'URL publique d'un fichier
   * @param {string} chemin 
   * @returns {string}
   */
  obtenirUrlFichier(chemin) {
    throw new Error('obtenirUrlFichier() doit être implémenté par l\'adaptateur.');
  }

  /**
   * Vérifie la connexion
   * @returns {Promise<boolean>}
   */
  async verifierConnexion() {
    throw new Error('verifierConnexion() doit être implémenté par l\'adaptateur.');
  }
}

/**
 * Constantes des noms de collections
 * Usage : COLLECTIONS.ARTICLES, COLLECTIONS.PROJETS, etc.
 */
export const COLLECTIONS = Object.freeze({
  ARTICLES:        'articles',
  PROJETS:         'projets',
  COMPETENCES:     'competences',
  EXPERIENCES:     'experiences',
  CERTIFICATIONS:  'certifications',
  FORMATIONS:      'formations',
  CATEGORIES:      'categories',
  TAGS:            'tags',
  MEDIAS:          'medias',
  PARAMETRES:      'parametres',
  UTILISATEURS:    'utilisateurs',
  ANALYTIQUES:     'analytiques',
  SEO:             'seo',
  COMMENTAIRES:    'commentaires',
});

/**
 * Statuts de publication
 */
export const STATUTS = Object.freeze({
  PUBLIE:   'publié',
  BROUILLON: 'brouillon',
  ARCHIVE:  'archivé',
  PLANIFIE: 'planifié',
});

/**
 * Erreurs de stockage
 */
export class ErreurStockage extends Error {
  /**
   * @param {string} message 
   * @param {string} code 
   * @param {*} [details]
   */
  constructor(message, code = 'ERREUR_STOCKAGE', details = null) {
    super(message);
    this.name = 'ErreurStockage';
    this.code = code;
    this.details = details;
  }
}

export class ErreurNonTrouve extends ErreurStockage {
  constructor(collection, id) {
    super(
      `Enregistrement non trouvé dans "${collection}" avec l'identifiant "${id}"`,
      'NON_TROUVE'
    );
    this.name = 'ErreurNonTrouve';
  }
}

export class ErreurAutorisation extends ErreurStockage {
  constructor(message = 'Accès non autorisé') {
    super(message, 'NON_AUTORISE');
    this.name = 'ErreurAutorisation';
  }
}

export class ErreurValidation extends ErreurStockage {
  constructor(message, champs = {}) {
    super(message, 'VALIDATION');
    this.name = 'ErreurValidation';
    this.champs = champs;
  }
}

/**
 * Utilitaires de transformation de données
 */
export const Transformateurs = {
  /**
   * Génère un slug URL-safe depuis un titre
   * @param {string} texte 
   * @returns {string}
   */
  slugifier(texte) {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * Estime le temps de lecture en minutes
   * @param {string} texte 
   * @returns {number}
   */
  tempsLecture(texte) {
    const motsParMinute = 200; // Vitesse de lecture française
    const nbMots = texte.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(nbMots / motsParMinute));
  },

  /**
   * Extrait un extrait depuis le corps d'un article
   * @param {string} corps - Texte HTML ou Markdown
   * @param {number} longueur - Longueur max en caractères
   * @returns {string}
   */
  extraire(corps, longueur = 160) {
    // Supprime le HTML
    const texte = corps.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (texte.length <= longueur) return texte;
    return texte.slice(0, longueur).replace(/\s+\S*$/, '') + '\u2026'; // Ellipse
  },
};
