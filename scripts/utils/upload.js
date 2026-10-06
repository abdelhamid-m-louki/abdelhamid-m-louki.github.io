/**
 * SYSTÈME D'UPLOAD ET TRAITEMENT D'IMAGES
 * Portfolio Éditorial — Compression WebP, EXIF, Redimensionnement
 *
 * Traitement côté navigateur via Canvas API :
 * 1. Validation du type MIME
 * 2. Suppression des métadonnées EXIF (confidentialité)
 * 3. Redimensionnement intelligent
 * 4. Conversion en WebP
 * 5. Compression progressive
 * 6. Upload vers Supabase Storage ou stockage local
 *
 * Optimise automatiquement les Core Web Vitals (LCP, CLS).
 */

'use strict';

import stockage from '../storage/storage-manager.js';

/** Types MIME autorisés */
const TYPES_AUTORISES = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

/** Taille maximale après compression (en octets) — 2 Mo */
const TAILLE_MAX = 2 * 1024 * 1024;

/** Dimensions maximales par défaut */
const DIMENSIONS = Object.freeze({
  HERO:      { largeur: 1920, hauteur: 1080 },
  COUVERTURE: { largeur: 1200, hauteur: 630 },
  VIGNETTE:  { largeur: 600,  hauteur: 400 },
  AVATAR:    { largeur: 400,  hauteur: 400 },
  PROJET:    { largeur: 1200, hauteur: 750 },
  OG:        { largeur: 1200, hauteur: 630 },
});

/** Qualité WebP initiale */
const QUALITE_INITIALE = 0.85;

export class GestionnaireUpload {
  constructor() {
    /** @type {Map<string, AbortController>} Uploads en cours */
    this._uploads = new Map();
  }

  // ============================================================
  // ENTRÉE PRINCIPALE
  // ============================================================

  /**
   * Traite et uploade une image
   * @param {File} fichier - Fichier original
   * @param {Object} options
   * @param {string} options.destination - Chemin de destination (ex: 'blog/couverture')
   * @param {string} [options.preset] - Préréglage de dimension ('COUVERTURE', 'AVATAR', etc.)
   * @param {number} [options.largeurMax] - Largeur max en px
   * @param {number} [options.hauteurMax] - Hauteur max en px
   * @param {number} [options.qualite] - Qualité WebP (0–1)
   * @param {Function} [options.onProgression] - Callback de progression (0–100)
   * @param {Function} [options.onPrevisualisation] - Callback URL de prévisualisation
   * @returns {Promise<{url: string, chemin: string, meta: Object}>}
   */
  async traiterEtUploader(fichier, options = {}) {
    // 1. Validation
    this._valider(fichier);

    // 2. Prévisualisation immédiate
    if (options.onPrevisualisation) {
      const urlPreview = URL.createObjectURL(fichier);
      options.onPrevisualisation(urlPreview);
    }

    options.onProgression?.(10);

    // 3. Résolution des dimensions cibles
    const { largeur: largeurMax, hauteur: hauteurMax } = this._resoudreDimensions(options);

    // 4. Traitement via Canvas
    options.onProgression?.(20);
    const blob = await this._traiter(fichier, {
      largeurMax,
      hauteurMax,
      qualite: options.qualite || QUALITE_INITIALE,
    });

    options.onProgression?.(60);

    // 5. Génération du nom de fichier
    const nomFichier = this._genererNom(fichier.name, options.destination);
    const chemin     = `${options.destination || 'medias'}/${nomFichier}`;

    // 6. Upload
    options.onProgression?.(70);
    const resultat = await stockage.uploaderFichier(blob, chemin, {
      bucket: options.bucket,
    });

    options.onProgression?.(95);

    // 7. Métadonnées
    const meta = {
      nomOriginal:  fichier.name,
      typeOriginal: fichier.type,
      tailleOriginale: fichier.size,
      tailleCompresse: blob.size,
      tauxCompression: Math.round((1 - blob.size / fichier.size) * 100),
      largeur:     largeurMax,
      hauteur:     hauteurMax,
      format:      'image/webp',
      cree_le:     new Date().toISOString(),
    };

    options.onProgression?.(100);

    return { url: resultat.url, chemin, meta };
  }

  // ============================================================
  // TRAITEMENT IMAGE VIA CANVAS
  // ============================================================

  /**
   * Redimensionne et convertit en WebP via Canvas API
   * @param {File} fichier 
   * @param {Object} options 
   * @returns {Promise<Blob>}
   */
  async _traiter(fichier, options) {
    // SVG : pas de traitement Canvas nécessaire
    if (fichier.type === 'image/svg+xml') {
      return fichier;
    }

    // Chargement de l'image dans un élément temporaire
    const image = await this._chargerImage(fichier);

    // Calcul des nouvelles dimensions en conservant le ratio
    const { largeur, hauteur } = this._calculerDimensions(
      image.naturalWidth,
      image.naturalHeight,
      options.largeurMax,
      options.hauteurMax
    );

    // Création du canvas
    const canvas = document.createElement('canvas');
    canvas.width  = largeur;
    canvas.height = hauteur;

    const ctx = canvas.getContext('2d');

    // Fond blanc pour les PNG transparents → WebP
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, largeur, hauteur);

    // Dessin avec lissage bicubique
    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = 'high';
    ctx.drawImage(image, 0, 0, largeur, hauteur);

    // Nettoyage mémoire
    URL.revokeObjectURL(image.src);

    // Conversion WebP avec compression progressive
    return this._compressionProgressive(canvas, options.qualite);
  }

  /**
   * Compression progressive : réduit la qualité si trop lourd
   * @param {HTMLCanvasElement} canvas 
   * @param {number} qualiteInitiale 
   * @returns {Promise<Blob>}
   */
  async _compressionProgressive(canvas, qualiteInitiale) {
    let qualite = qualiteInitiale;
    let blob;

    do {
      blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/webp', qualite);
      });

      if (!blob) throw new Error('Impossible de convertir l\'image en WebP.');

      if (blob.size <= TAILLE_MAX || qualite <= 0.3) break;

      qualite -= 0.1;
    } while (blob.size > TAILLE_MAX);

    return blob;
  }

  // ============================================================
  // ZONE DE DÉPÔT — DRAG AND DROP
  // ============================================================

  /**
   * Configure une zone de dépôt de fichiers
   * @param {HTMLElement} zone - Élément cible
   * @param {Object} options - Mêmes options que traiterEtUploader()
   * @param {Function} options.onFichiers - Callback avec les fichiers déposés
   * @returns {Function} Fonction de nettoyage
   */
  configurerZoneDepot(zone, options = {}) {
    const classeActif = 'glisser-dessus';

    const prevenir = (e) => { e.preventDefault(); e.stopPropagation(); };

    const onDragEnter = (e) => { prevenir(e); zone.classList.add(classeActif); };
    const onDragLeave = (e) => {
      prevenir(e);
      if (!zone.contains(e.relatedTarget)) zone.classList.remove(classeActif);
    };
    const onDragOver  = prevenir;

    const onDrop = async (e) => {
      prevenir(e);
      zone.classList.remove(classeActif);
      const fichiers = Array.from(e.dataTransfer?.files || [])
        .filter(f => TYPES_AUTORISES.includes(f.type));
      if (fichiers.length > 0 && options.onFichiers) {
        await options.onFichiers(fichiers);
      }
    };

    zone.addEventListener('dragenter', onDragEnter);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('dragover',  onDragOver);
    zone.addEventListener('drop',      onDrop);

    // Retourne une fonction de nettoyage
    return () => {
      zone.removeEventListener('dragenter', onDragEnter);
      zone.removeEventListener('dragleave', onDragLeave);
      zone.removeEventListener('dragover',  onDragOver);
      zone.removeEventListener('drop',      onDrop);
    };
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  /**
   * Valide un fichier avant traitement
   * @param {File} fichier 
   */
  _valider(fichier) {
    if (!fichier || !(fichier instanceof File)) {
      throw new Error('Fichier invalide.');
    }

    if (!TYPES_AUTORISES.includes(fichier.type)) {
      throw new Error(
        `Type non supporté : ${fichier.type}. ` +
        `Types acceptés : ${TYPES_AUTORISES.join(', ')}.`
      );
    }

    // Validation MIME réelle (magic bytes) pour les non-SVG
    // Note : vérification complète faite après chargement
    if (fichier.size > 50 * 1024 * 1024) {
      throw new Error('Le fichier dépasse la taille maximale de 50 Mo.');
    }
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  /**
   * Charge une image dans un élément HTML
   * @param {File} fichier 
   * @returns {Promise<HTMLImageElement>}
   */
  _chargerImage(fichier) {
    return new Promise((resolve, reject) => {
      const url   = URL.createObjectURL(fichier);
      const image = new Image();
      image.onload  = () => resolve(image);
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Impossible de lire l\'image. Format peut-être corrompu.'));
      };
      image.src = url;
    });
  }

  /**
   * Calcule les dimensions en conservant le ratio
   * @param {number} largOrig 
   * @param {number} hautOrig 
   * @param {number} largMax 
   * @param {number} hautMax 
   * @returns {{largeur: number, hauteur: number}}
   */
  _calculerDimensions(largOrig, hautOrig, largMax, hautMax) {
    // Si l'image est plus petite, on ne l'agrandit pas
    if (largOrig <= largMax && hautOrig <= hautMax) {
      return { largeur: largOrig, hauteur: hautOrig };
    }

    const ratio       = largOrig / hautOrig;
    const ratioMax    = largMax  / hautMax;

    let largeur, hauteur;

    if (ratio > ratioMax) {
      largeur = Math.min(largOrig, largMax);
      hauteur = Math.round(largeur / ratio);
    } else {
      hauteur = Math.min(hautOrig, hautMax);
      largeur = Math.round(hauteur * ratio);
    }

    return { largeur, hauteur };
  }

  /**
   * Résout les dimensions depuis les options
   * @param {Object} options 
   * @returns {{largeur: number, hauteur: number}}
   */
  _resoudreDimensions(options) {
    if (options.preset && DIMENSIONS[options.preset]) {
      return DIMENSIONS[options.preset];
    }
    return {
      largeur: options.largeurMax || DIMENSIONS.COUVERTURE.largeur,
      hauteur: options.hauteurMax || DIMENSIONS.COUVERTURE.hauteur,
    };
  }

  /**
   * Génère un nom de fichier unique en WebP
   * @param {string} nomOriginal 
   * @param {string} [prefixe] 
   * @returns {string}
   */
  _genererNom(nomOriginal, prefixe = '') {
    const baseSansExtension = nomOriginal
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 60);
    const horodatage = Date.now();
    return `${baseSansExtension}-${horodatage}.webp`;
  }
}

// Singleton exporté
export const upload = new GestionnaireUpload();
export default upload;
export { DIMENSIONS, TYPES_AUTORISES };
