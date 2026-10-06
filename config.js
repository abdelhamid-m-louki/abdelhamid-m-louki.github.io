/**
 * Configuration globale du site (non-secrète).
 * Chargée en premier via <script src="/config.js"> — avant tous les modules.
 * Aucune clé secrète ici : les clés serveur vivent dans les env vars Vercel.
 */
window.CONFIG = {
  SITE_NOM:          'AM. LOUKI',
  SITE_URL:          'https://amlouki.me',
  AUTEUR_NOM:        'Abdel-hamid M. LOUKI',

  SUPABASE_URL:      'https://hwbpgimxzrsgqyrdggiy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnBnaW14enJzZ3F5cmRnZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTY3NDgsImV4cCI6MjEwNjg3Mjc0OH0.pMaEs43hNGACBo_wRx4FjNchqgIT4hoUBoLNkfTJsJU',

  /* Backend Vercel — seul /api/* y est déployé (frontend = GitHub Pages) */
  API_BASE:          'https://abdelhamid-m-loukigithubio.vercel.app',
};
