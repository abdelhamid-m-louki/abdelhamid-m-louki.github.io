/**
 * Configuration globale du site (non-secrète).
 * Chargée en premier via <script src="/config.js"> — avant tous les modules.
 * Aucune clé secrète ici : les clés serveur vivent dans les env vars Vercel.
 */
window.CONFIG = {
  SITE_NOM:          'AM. LOUKI',
  SITE_URL:          'https://amlouki.me',
  AUTEUR_NOM:        'Abdel-hamid M. LOUKI',

  SUPABASE_URL:      'https://qayrcorszsyiujzxfmxw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFheXJjb3JzenN5aXVqenhmbXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTk1MzcsImV4cCI6MjA5NDc3NTUzN30.4vwMex2ddoD3bCLPzdj60LoDZ5ba2igmBpVtOauQa7I',

  /* Phase 2 : URL du backend Vercel (ex. 'https://...vercel.app') */
  API_BASE:          ''
};
