/**
 * Configuration globale du site (non-secrète).
 * Chargée en premier via <script src="/config.js"> — avant tous les modules.
 * Aucune clé secrète ici : les clés serveur vivent dans les env vars Vercel.
 *
 * Ces valeurs sont des DÉFAUTS : elles sont surchargées à chaud depuis
 * l'admin (collections « parametres » et « seo »). Aucune information
 * d'identité, de contact ou de contenu ne doit être câblée en dur dans les
 * pages : les pages utilisent des variables data-contenu="…" remplies par
 * scripts/site-parametres.js depuis la base de données.
 */
window.CONFIG = {
  /* Identité — valeurs neutres, surchargées depuis la base */
  SITE_NOM:          'Portfolio',
  SITE_URL:          '',
  SITE_DESCRIPTION:  'Portfolio éditorial',
  SITE_META_DESCRIPTION:
    'Portfolio éditorial : projets, réflexions et publications.',
  SITE_LANGUE:       'fr',
  SITE_LOCALE:       'fr_FR',

  AUTEUR_NOM:        '',
  AUTEUR_PRENOM:     '',
  AUTEUR_NOM_FAMILLE:'',
  AUTEUR_EMAIL:      '',
  AUTEUR_TITRE:      '',
  AUTEUR_SPECIALITE: '',
  AUTEUR_STATUT:     '',
  AUTEUR_BIO:        '',
  AUTEUR_PHOTO:      '',
  AUTEUR_PHOTO_ALT:  '',
  A_PROPOS_DESCRIPTION: '',
  LOCALISATION:      '',

  /* Sous-titre du masthead + métrique « Année d'études » (paramétrables) */
  SITE_SLOGAN:            '',
  AUTEUR_ANNEE:           '',
  AUTEUR_ANNEE_LIBELLE:   '',

  /* Apparence éditoriale (paramétrable depuis l'admin) */
  SITE_EDITION:           '',
  SITE_NUMERO:            '',
  SITE_FOOTER_DESCRIPTION: '',
  SITE_CITATION:          '',

  /* Cards du portrait (paramétrables depuis l'admin) */
  CARTE_1_TITRE:          '',
  CARTE_1_SOUS:           '',
  CARTE_2_TITRE:          '',
  CARTE_2_SOUS:           '',
  CARTE_3_TITRE:          '',
  CARTE_3_SOUS:           '',

  /* Disponibilité (paramétrable depuis l'admin) */
  DISPONIBLE:             false,
  DISPONIBILITE_LIBELLE:  '',
  DISPONIBILITE_TEXTE:    '',
  DELAI_REPONSE:          '',

  /* Réseaux sociaux (paramétrables depuis l'admin) */
  GITHUB_URL:        '',
  GITHUB_LABEL:      '',
  LINKEDIN_URL:      '',
  LINKEDIN_LABEL:    '',
  TWITTER_HANDLE:    '',
  TWITTER_URL:       '',
  CV_URL:            '',

  /* Mentions légales (paramétrables depuis l'admin) */
  LEGAL_EDITEUR_DESCRIPTION: '',
  LEGAL_DATE_MAJ:            '',

  /* SEO (paramétrable depuis l'admin / collection « seo ») */
  SEO_IMAGE_DEFAUT:      '/assets/og-defaut.jpg',
  SEO_IMAGE_ACCUEIL:     '/assets/og-accueil.jpg',
  SEO_INDEXATION:        true,
  SEO_SITEMAP_AUTO:      true,
  SEO_GOOGLE_ANALYTICS_ID: '',
  SEO_GOOGLE_SEARCH_CONSOLE: '',

  /* Contenu */
  ARTICLES_PAR_PAGE: 9,
  MAINTENANCE: false,

  SUPABASE_URL:      'https://hwbpgimxzrsgqyrdggiy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnBnaW14enJzZ3F5cmRnZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTY3NDgsImV4cCI6MjEwNjg3Mjc0OH0.pMaEs43hNGACBo_wRx4FjNchqgIT4hoUBoLNkfTJsJU',

  /* Backend Vercel — seul /api/* y est déployé (frontend = GitHub Pages) */
  API_BASE:          'https://abdelhamid-m-loukigithubio.vercel.app',

  /* Taille maximale d'un fichier compressé (upload) — doit rester ≤ la limite serveur (3 Mo) */
  MAX_UPLOAD_MO: 3,
};
