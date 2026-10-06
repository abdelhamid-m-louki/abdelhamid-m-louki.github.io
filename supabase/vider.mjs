#!/usr/bin/env node
/**
 * PHASE 7 — Purge du contenu générique (demo)
 * ------------------------------------------
 * Supprime tout le contenu "placeholder" (articles, projets, compétences…)
 * afin que le site soit alimenté uniquement depuis l'admin.
 *
 * CONSERVÉ : utilisateurs (profil admin), parametres, seo (config du site).
 *
 * Usage :
 *   node supabase/vider.mjs
 *
 * Lit les variables dans .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(__dirname, '..');

function chargerEnv() {
  const env = { ...process.env };
  const chemin = path.join(racine, '.env');
  if (fs.existsSync(chemin)) {
    for (const ligne of fs.readFileSync(chemin, 'utf8').split(/\r?\n/)) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = chargerEnv();
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✖ Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Contenu à vider (tout sauf config/admin) */
const TABLES_A_VIDER = [
  'articles', 'projets', 'competences', 'experiences', 'certifications',
  'formations', 'categories', 'tags', 'medias', 'analytiques', 'commentaires',
];

console.log('— Purge du contenu générique —');
for (const table of TABLES_A_VIDER) {
  const { count } = await sb.from(table).select('id', { count: 'exact', head: true });
  const nb = count || 0;
  const { error } = await sb.from(table).delete().neq('id', '___');
  if (error) {
    console.error(`✖ ${table} : ${error.message}`);
    continue;
  }
  console.log(`✓ ${table} : ${nb} ligne(s) supprimée(s)`);
}

console.log('');
console.log('— Nettoyage des placeholders de config (seo) —');
for (const cle of ['twitter_handle']) {
  const { error } = await sb.from('seo').update({ valeur: '' }).eq('cle', cle);
  console.log(error ? `✖ ${cle} : ${error.message}` : `✓ ${cle} nettoyé`);
}

console.log('');
console.log('Conservés : utilisateurs (profil admin), parametres, seo.');
console.log('✔ Purge terminée.');