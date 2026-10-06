/**
 * Configuration globale du site (non-secrète).
 * Chargée en premier via <script src="/config.js"> — avant tous les modules.
 * Aucune clé secrète ici : les clés serveur vivent dans les env vars Vercel.
 *
 * Ces valeurs sont des DÉFAUTS : elles peuvent être surchargées à chaud
 * depuis l'admin (collection « parametres »). Rien ne doit être câblé en dur
 * dans les pages quand la donnée existe ici.
 */
window.CONFIG = {
  /* Identité */
  SITE_NOM:          'AM. LOUKI',
  SITE_URL:          'https://amlouki.me',
  SITE_DESCRIPTION:  'Portfolio éditorial et blog de sécurité informatique',
  AUTEUR_NOM:        'Abdel-hamid M. LOUKI',
  AUTEUR_EMAIL:      'am.louki@outlook.fr',
  AUTEUR_TITRE:      'Étudiant en ingénierie de la sécurité informatique',
  AUTEUR_BIO:        "Étudiant en ingénierie de la sécurité informatique, passionné par la cybersécurité, le développement web et l'écriture technique.",
  AUTEUR_PHOTO:      '/assets/images/portrait.png',
  LOCALISATION:      'Paris, France',

  /* Sous-titre du masthead + métrique « Année d'études » (paramétrables) */
  SITE_SLOGAN:            '',
  AUTEUR_ANNEE:           '',
  AUTEUR_ANNEE_LIBELLE:   '',

  /* Réseaux sociaux (paramétrables depuis l'admin) */
  GITHUB_URL:        'https://github.com/dirdaymi',
  LINKEDIN_URL:      'https://linkedin.com/in/amlouki',
  TWITTER_HANDLE:    '',
  TWITTER_URL:       '',

  SUPABASE_URL:      'https://hwbpgimxzrsgqyrdggiy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnBnaW14enJzZ3F5cmRnZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTY3NDgsImV4cCI6MjEwNjg3Mjc0OH0.pMaEs43hNGACBo_wRx4FjNchqgIT4hoUBoLNkfTJsJU',

  /* Backend Vercel — seul /api/* y est déployé (frontend = GitHub Pages) */
  API_BASE:          'https://abdelhamid-m-loukigithubio.vercel.app',

  /* Taille maximale d'un fichier compressé (upload) — doit rester ≤ la limite serveur (3 Mo) */
  MAX_UPLOAD_MO: 3,
};