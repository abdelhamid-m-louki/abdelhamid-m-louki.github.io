#!/usr/bin/env node
/**
 * PHASE 5 — Seed Supabase du Portfolio Éditorial
 * -----------------------------------------------
 * - Appliquer d'abord supabase/schema.sql dans le SQL Editor Supabase.
 * - Crée le compte Admin (Supabase Auth) si absent.
 * - Insère le profil utilisateur admin.
 * - Peuple toutes les tables à partir des fichiers supabase/seed-data/*.json.
 *
 * Minuit / sensibles : les secrets ne sont PAS dans le repo
 * (variables d'environnement ou fichier .env local non commité).
 *
 * Usage :
 *   node supabase/seed.mjs
 *
 * Variables d'environnement requises :
 *   SUPABASE_URL            https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL             (défaut : admin@exemple.fr)
 *   ADMIN_PASSWORD          (obligatoire si le compte n'existe pas déjà)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(__dirname, '..');

// ------------------------------------------------------------
// Chargement des variables d'environnement (.env local autorisé)
// ------------------------------------------------------------
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
const URL_SUPABASE = env.SUPABASE_URL;
const CLE_SERVICE  = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_ADMIN  = env.ADMIN_EMAIL || 'admin@exemple.fr';
const NOM_ADMIN    = env.ADMIN_NOM || 'Administrateur';

if (!URL_SUPABASE || !CLE_SERVICE) {
  console.error('✖ Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
  console.error('  (ex. : dans le terminal PowerShell)');
  console.error('  $env:SUPABASE_URL="https://xxxx.supabase.co"');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const sb = createClient(URL_SUPABASE, CLE_SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------
// 1. Compte administrateur (Supabase Auth)
// ------------------------------------------------------------
async function garantirAdmin() {
  const { data: liste } = await sb.auth.admin.listUsers();
  let admin = (liste.users || []).find((u) => u.email === EMAIL_ADMIN.toLowerCase());

  if (admin) {
    console.log(`✓ Compte admin existant : ${EMAIL_ADMIN} (${admin.id})`);
    return admin;
  }

  if (!env.ADMIN_PASSWORD) {
    console.error('✖ Aucun compte existant pour ' + EMAIL_ADMIN +
      ' — définissez ADMIN_PASSWORD (et éventuellement ADMIN_EMAIL).');
    process.exit(1);
  }

  const { data, error } = await sb.auth.admin.createUser({
    email: EMAIL_ADMIN,
    password: env.ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (error) {
    console.error('✖ Création du compte admin impossible : ' + error.message);
    process.exit(1);
  }

  console.log(`✓ Compte admin créé : ${EMAIL_ADMIN} (${data.user.id})`);
  return data.user;
}

// ------------------------------------------------------------
// 2. Profil utilisateur (table utilisteurs)
// ------------------------------------------------------------
async function garantirProfil(admin) {
  const profil = {
    id: admin.id,
    email: EMAIL_ADMIN.toLowerCase(),
    nom: NOM_ADMIN,
    role: 'admin',
    avatar: null,
    actif: true,
    cree_le: new Date().toISOString(),
    modifie_le: new Date().toISOString(),
  };

  const { error } = await sb
    .from('utilisateurs')
    .upsert(profil, { onConflict: 'email' });

  if (error) {
    console.error('✖ Profil utilisateur impossible : ' + error.message);
    process.exit(1);
  }
  console.log(`✓ Profil administrateur enregistré (rôle : admin)`);
}

// ------------------------------------------------------------
// 3. Contenu (supabase/seed-data/*.json → tables)
// ------------------------------------------------------------
const COLLECTIONS = [
  'articles', 'projets', 'competences', 'experiences', 'certifications',
  'formations', 'categories', 'tags', 'medias', 'parametres',
  'analytiques', 'commentaires',
];

async function peuplerContenu() {
  for (const collection of COLLECTIONS) {
    const fichier = path.join(__dirname, 'seed-data', `${collection}.json`);
    if (!fs.existsSync(fichier)) { console.log(`— ${collection} : fichier absent, ignoré`); continue; }

    let lignes;
    try {
      lignes = JSON.parse(fs.readFileSync(fichier, 'utf8'));
    } catch {
      console.log(`— ${collection} : JSON illisible, ignoré`);
      continue;
    }

    if (!Array.isArray(lignes) || lignes.length === 0) {
      console.log(`— ${collection} : aucune donnée`);
      continue;
    }

    const { error } = await sb.from(collection).upsert(lignes, { onConflict: 'id' });
    if (error) {
      console.error(`✖ ${collection} : ${error.message}`);
      continue;
    }
    console.log(`✓ ${collection} : ${lignes.length} enregistrements`);
  }
}

// ------------------------------------------------------------
// 4. Table SEO (data/seo.json → lignes cle/valeur)
// ------------------------------------------------------------
async function peuplerSeo() {
  const fichier = path.join(__dirname, 'seed-data', 'seo.json');
  if (!fs.existsSync(fichier)) return;

  let objet;
  try { objet = JSON.parse(fs.readFileSync(fichier, 'utf8')); }
  catch { console.log('— seo : JSON illisible, ignoré'); return; }

  const lignes = Object.entries(objet).map(([cle, valeur]) => ({
    id: `seo-${cle}`,
    cle,
    valeur: typeof valeur === 'boolean' || typeof valeur === 'number' ? String(valeur) : valeur,
    type: 'string',
    description: cle,
  }));

  if (!lignes.length) return;

  const { error } = await sb.from('seo').upsert(lignes, { onConflict: 'id' });
  if (error) { console.error('✖ seo : ' + error.message); return; }
  console.log(`✓ seo : ${lignes.length} clés`);
}

// ------------------------------------------------------------
// Lancement
// ------------------------------------------------------------
console.log('— Seed du Portfolio Éditorial —');
console.log('  Supabase : ' + URL_SUPABASE);
console.log('  Email admin : ' + EMAIL_ADMIN);
console.log('');

const admin = await garantirAdmin();
await garantirProfil(admin);
await peuplerSeo();
await peuplerContenu();

console.log('');
console.log('✔ Seed terminé.');