/**
 * ADAPTATEUR JSON LOCAL
 * Portfolio Éditorial — Stockage JSON en mémoire / localStorage
 *
 * Adaptateur de secours qui fonctionne sans Supabase.
 * Utilise localStorage pour la persistance côté navigateur.
 * Données initiales chargées depuis /data/*.json.
 *
 * Usage : développement local, démonstration, fallback hors-ligne.
 */

'use strict';

import {
  InterfaceStockage,
  ErreurStockage,
  ErreurNonTrouve,
  ErreurValidation,
  Transformateurs,
} from './interfaces.js';

/** Clé de préfixe dans localStorage */
const PREFIXE_CLE = 'portfolio_editorial_';

/** Données JSON initiales à charger */
const FICHIERS_DONNEES = {
  articles:       '/data/articles.json',
  projets:        '/data/projets.json',
  competences:    '/data/competences.json',
  experiences:    '/data/experiences.json',
  certifications: '/data/certifications.json',
  formations:     '/data/formations.json',
  categories:     '/data/categories.json',
  tags:           '/data/tags.json',
  medias:         '/data/medias.json',
  parametres:     '/data/parametres.json',
  utilisateurs:   '/data/utilisateurs.json',
  analytiques:    '/data/analytiques.json',
  seo:            '/data/seo.json',
};

export class AdaptateurJsonLocal extends InterfaceStockage {
  constructor() {
    super();
    /** @type {Map<string, Array>} Cache en mémoire */
    this._cache = new Map();
    /** @type {boolean} Données initiales chargées */
    this._initialise = false;
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Charge les données depuis localStorage ou les fichiers JSON initiaux
   */
  async initialiser() {
    if (this._initialise) return;

    for (const [collection, cheminFichier] of Object.entries(FICHIERS_DONNEES)) {
      const cleLocale = `${PREFIXE_CLE}${collection}`;

      // Priorité : localStorage (données modifiées)
      const stockeLocalement = localStorage.getItem(cleLocale);
      if (stockeLocalement) {
        try {
          this._cache.set(collection, JSON.parse(stockeLocalement));
          continue;
        } catch (_) {
          // Données corrompues → recharger depuis JSON
          localStorage.removeItem(cleLocale);
        }
      }

      // Fallback : fichier JSON initial
      try {
        const reponse = await fetch(cheminFichier);
        if (reponse.ok) {
          const donnees = await reponse.json();
          const tableau = Array.isArray(donnees) ? donnees : (donnees.donnees || []);
          this._cache.set(collection, tableau);
          this._persister(collection);
        } else {
          this._cache.set(collection, []);
        }
      } catch (_) {
        this._cache.set(collection, []);
      }
    }

    this._initialise = true;
  }

  // ============================================================
  // LECTURE
  // ============================================================

  async obtenirTous(collection, options = {}) {
    await this._assurerinitialise();
    let donnees = [...(this._cache.get(collection) || [])];

    // Filtres
    if (options.filtres) {
      donnees = this._appliquerFiltres(donnees, options.filtres);
    }

    // Recherche textuelle
    if (options.recherche && options.champsRecherche) {
      donnees = this._filtrerParTexte(donnees, options.recherche, options.champsRecherche);
    }

    const total = donnees.length;

    // Tri
    if (options.tri) {
      const ordre = options.ordre === 'asc' ? 1 : -1;
      donnees.sort((a, b) => {
        const va = a[options.tri];
        const vb = b[options.tri];
        if (va === vb) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return va > vb ? ordre : -ordre;
      });
    } else {
      // Tri par défaut : date de création décroissante
      donnees.sort((a, b) => {
        const da = new Date(a.cree_le || a.date || 0);
        const db = new Date(b.cree_le || b.date || 0);
        return db - da;
      });
    }

    // Pagination
    const parPage = options.parPage || options.limite || 0;
    const page    = Math.max(1, options.page || 1);

    if (parPage > 0) {
      const debut = (page - 1) * parPage;
      donnees = donnees.slice(debut, debut + parPage);
    } else if (options.limite && options.limite > 0) {
      donnees = donnees.slice(0, options.limite);
    }

    return { donnees, total, page: page };
  }

  async obtenirParId(collection, id) {
    await this._assurerinitialise();
    const donnees = this._cache.get(collection) || [];
    const item = donnees.find(d => String(d.id) === String(id));
    if (!item) throw new ErreurNonTrouve(collection, id);
    return { ...item };
  }

  async obtenirParChamp(collection, champ, valeur) {
    await this._assurerinitialise();
    const donnees = this._cache.get(collection) || [];
    const item = donnees.find(d => d[champ] === valeur);
    return item ? { ...item } : null;
  }

  // ============================================================
  // ÉCRITURE
  // ============================================================

  async creer(collection, donnees) {
    await this._assurerinitialise();
    this._validerDonnees(donnees);

    const tableau = this._cache.get(collection) || [];
    const nouvelItem = {
      ...donnees,
      id:       donnees.id || this._genererIdentifiant(),
      cree_le:  donnees.cree_le || new Date().toISOString(),
      modifie_le: new Date().toISOString(),
    };

    tableau.unshift(nouvelItem); // Nouvelles entrées en tête
    this._cache.set(collection, tableau);
    this._persister(collection);

    return { ...nouvelItem };
  }

  async metAJour(collection, id, donnees) {
    await this._assurerinitialise();
    const tableau = this._cache.get(collection) || [];
    const index = tableau.findIndex(d => String(d.id) === String(id));

    if (index === -1) throw new ErreurNonTrouve(collection, id);

    const itemMisAJour = {
      ...tableau[index],
      ...donnees,
      id,
      modifie_le: new Date().toISOString(),
    };

    tableau[index] = itemMisAJour;
    this._cache.set(collection, tableau);
    this._persister(collection);

    return { ...itemMisAJour };
  }

  async supprimer(collection, id) {
    await this._assurerinitialise();
    const tableau = this._cache.get(collection) || [];
    const index = tableau.findIndex(d => String(d.id) === String(id));

    if (index === -1) throw new ErreurNonTrouve(collection, id);

    tableau.splice(index, 1);
    this._cache.set(collection, tableau);
    this._persister(collection);

    return true;
  }

  // ============================================================
  // RECHERCHE
  // ============================================================

  async rechercher(collection, terme, champs = []) {
    await this._assurerinitialise();
    const donnees = this._cache.get(collection) || [];
    return this._filtrerParTexte(donnees, terme, champs);
  }

  async compter(collection, filtres = {}) {
    await this._assurerinitialise();
    let donnees = this._cache.get(collection) || [];
    if (Object.keys(filtres).length > 0) {
      donnees = this._appliquerFiltres(donnees, filtres);
    }
    return donnees.length;
  }

  // ============================================================
  // OPÉRATIONS EN LOT
  // ============================================================

  async lot(operations) {
    const resultats = [];
    for (const op of operations) {
      switch (op.operation) {
        case 'creer':
          resultats.push(await this.creer(op.collection, op.donnees));
          break;
        case 'metAJour':
          resultats.push(await this.metAJour(op.collection, op.id, op.donnees));
          break;
        case 'supprimer':
          resultats.push(await this.supprimer(op.collection, op.id));
          break;
        default:
          throw new ErreurStockage(`Opération inconnue : ${op.operation}`, 'OP_INCONNUE');
      }
    }
    return resultats;
  }

  // ============================================================
  // GESTION DES FICHIERS (simulé en localStorage)
  // ============================================================

  async uploaderFichier(fichier, chemin, options = {}) {
    // En mode local, on crée une URL objet temporaire
    const url = URL.createObjectURL(fichier);
    const media = {
      id:       this._genererIdentifiant(),
      nom:      fichier.name,
      type:     fichier.type,
      taille:   fichier.size,
      chemin,
      url,
      cree_le:  new Date().toISOString(),
    };

    // Enregistre dans la collection médias
    await this.creer('medias', media);

    return { url, chemin };
  }

  async supprimerFichier(chemin) {
    // En mode local, rien à faire côté réseau
    return true;
  }

  obtenirUrlFichier(chemin) {
    return chemin; // En mode local, le chemin est déjà l'URL
  }

  async verifierConnexion() {
    return true; // Toujours disponible en mode local
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  async _assurerinitialise() {
    if (!this._initialise) await this.initialiser();
  }

  /**
   * Persiste une collection dans localStorage
   * @param {string} collection
   */
  _persister(collection) {
    try {
      const cle = `${PREFIXE_CLE}${collection}`;
      const donnees = this._cache.get(collection) || [];
      localStorage.setItem(cle, JSON.stringify(donnees));
    } catch (err) {
      // localStorage plein ou désactivé
      console.warn(`[AdaptateurJsonLocal] Impossible de persister "${collection}" :`, err.message);
    }
  }

  /**
   * Applique des filtres sur un tableau de données
   * @param {Array} donnees 
   * @param {Object} filtres - { champ: valeur }
   * @returns {Array}
   */
  _appliquerFiltres(donnees, filtres) {
    return donnees.filter(item => {
      return Object.entries(filtres).every(([champ, valeur]) => {
        if (valeur === null || valeur === undefined) return true;
        if (Array.isArray(valeur)) return valeur.includes(item[champ]);
        return String(item[champ]) === String(valeur);
      });
    });
  }

  /**
   * Filtre par texte libre sur plusieurs champs
   * @param {Array} donnees 
   * @param {string} terme 
   * @param {string[]} champs 
   * @returns {Array}
   */
  _filtrerParTexte(donnees, terme, champs) {
    const termeNorm = terme.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return donnees.filter(item => {
      const champsRecherche = champs.length > 0 ? champs : Object.keys(item);
      return champsRecherche.some(champ => {
        const valeur = item[champ];
        if (!valeur || typeof valeur !== 'string') return false;
        const valeurNorm = valeur.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return valeurNorm.includes(termeNorm);
      });
    });
  }

  /**
   * Génère un identifiant unique (UUID v4 simplifié)
   * @returns {string}
   */
  _genererIdentifiant() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Validation basique des données
   * @param {Object} donnees 
   */
  _validerDonnees(donnees) {
    if (!donnees || typeof donnees !== 'object' || Array.isArray(donnees)) {
      throw new ErreurValidation('Les données doivent être un objet non-null.');
    }
  }

  /**
   * Vide le cache et le localStorage (utile pour les tests)
   */
  reinitialiser() {
    for (const collection of Object.keys(FICHIERS_DONNEES)) {
      localStorage.removeItem(`${PREFIXE_CLE}${collection}`);
    }
    this._cache.clear();
    this._initialise = false;
  }
}
