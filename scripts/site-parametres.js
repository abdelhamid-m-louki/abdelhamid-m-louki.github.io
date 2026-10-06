/**
 * PARAMÈTRES DU SITE — chargement dynamique
 * Portfolio Éditorial
 *
 * Charge la collection « parametres » (Supabase, RLS lecture publique) et
 * fusionne les valeurs dans window.CONFIG AVANT/EN PARALLÈLE des modules.
 * Les valeurs config.js servent de défauts : tout ce qui est réglé dans
 * l'admin (Paramètres / SEO) prend le dessus.
 *
 * Injecte aussi les zones d'identité du DOM marquées data-contenu="…"
 * (nom, intitulé, ville, email, réseaux, disponibilité), sans écraser le
 * contenu statique si aucun paramètre n'est défini.
 */

(function () {
  'use strict';

  var CONFIG = window.CONFIG || (window.CONFIG = {});
  var SUPABASE_URL = CONFIG.SUPABASE_URL || '';
  var CLE_ANON = CONFIG.SUPABASE_ANON_KEY || '';

  /** Correspondance « cle » parametres → clé CONFIG */
  var CORRESPONDANCE = {
    site_nom:            'SITE_NOM',
    site_url:            'SITE_URL',
    description_defaut:  'SITE_DESCRIPTION',
    auteur_nom:          'AUTEUR_NOM',
    auteur_titre:        'AUTEUR_TITRE',
    auteur_bio:          'AUTEUR_BIO',
    email_contact:       'AUTEUR_EMAIL',
    auteur_localisation: 'LOCALISATION',
    github_url:          'GITHUB_URL',
    linkedin_url:        'LINKEDIN_URL',
    twitter_handle:      'TWITTER_HANDLE',
    site_slogan:         'SITE_SLOGAN',
  };

  /** Couples prenom/nom_famille → AUTEUR_NOM (si auteur_nom absent) */
  function composerNom(parametres) {
    var prenom = '';
    var nom = '';
    parametres.forEach(function (p) {
      if (p.cle === 'auteur_prenom')     prenom = String(p.valeur || '');
      if (p.cle === 'auteur_nom_famille') nom = String(p.valeur || '');
    });
    return (prenom + ' ' + nom).trim();
  }

  /** Applique les valeurs récupérées à window.CONFIG */
  function appliquer(parametres) {
    parametres.forEach(function (p) {
      var cible = CORRESPONDANCE[p.cle];
      if (cible) {
        var valeur = p.valeur;
        if (cible === 'TWITTER_HANDLE' && typeof valeur === 'string') {
          valeur = valeur.trim().replace(/^@/, '');
        }
        if (cible === 'TWITTER_HANDLE' || cible === 'GITHUB_URL' || cible === 'LINKEDIN_URL') {
          // Valeurs vides = non renseignées : garde le défaut config.js
          if (String(valeur || '').trim() === '') return;
        }
        CONFIG[cible] = valeur;
      }
      if (p.cle === 'auteur_nom' && String(p.valeur || '').trim() === '') {
        var nom = composerNom(parametres);
        if (nom) CONFIG.AUTEUR_NOM = nom;
      }
      if (p.cle === 'disponible') {
        CONFIG.DISPONIBLE = String(p.valeur) === 'true';
      }
    });

    if (CONFIG.TWITTER_HANDLE && !CONFIG.TWITTER_URL) {
      CONFIG.TWITTER_URL = 'https://x.com/' + CONFIG.TWITTER_HANDLE;
    }

    // Notifie les modules.
    document.dispatchEvent(new CustomEvent('config:charge', { detail: CONFIG }));

    injecterDom();
  }

  /** Met à jour les zones d'identité du DOM marquées data-contenu="…" */
  function injecterDom() {
    var zones = document.querySelectorAll('[data-contenu]');

    zones.forEach(function (zone) {
      var type = zone.getAttribute('data-contenu');

      switch (type) {
        case 'auteur-nom':
          if (CONFIG.AUTEUR_NOM) zone.textContent = CONFIG.AUTEUR_NOM;
          break;
        case 'auteur-titre':
          if (CONFIG.AUTEUR_TITRE) zone.textContent = CONFIG.AUTEUR_TITRE;
          break;
        case 'auteur-bio':
          if (CONFIG.AUTEUR_BIO) zone.textContent = CONFIG.AUTEUR_BIO;
          break;
        case 'localisation':
          if (CONFIG.LOCALISATION) zone.textContent = CONFIG.LOCALISATION;
          break;
        case 'email':
          if (CONFIG.AUTEUR_EMAIL) {
            if (zone.tagName === 'A') zone.setAttribute('href', 'mailto:' + CONFIG.AUTEUR_EMAIL);
            // Lien purement iconographique (svg) : on ne remplace pas le contenu
            if (!zone.querySelector('svg')) zone.textContent = CONFIG.AUTEUR_EMAIL;
          }
          break;
        case 'github':
          if (CONFIG.GITHUB_URL && zone.tagName === 'A') zone.setAttribute('href', CONFIG.GITHUB_URL);
          break;
        case 'linkedin':
          if (CONFIG.LINKEDIN_URL && zone.tagName === 'A') zone.setAttribute('href', CONFIG.LINKEDIN_URL);
          break;
        case 'twitter':
          if (CONFIG.TWITTER_URL && zone.tagName === 'A') {
            zone.setAttribute('href', CONFIG.TWITTER_URL);
            zone.style.display = '';
          } else {
            zone.style.display = 'none';
          }
          break;
        case 'twitter-label':
          if (CONFIG.TWITTER_URL) {
            zone.textContent = CONFIG.TWITTER_HANDLE ? '@' + CONFIG.TWITTER_HANDLE : zone.textContent;
          }
          break;
        case 'disponible':
          zone.style.display = CONFIG.DISPONIBLE === false ? 'none' : '';
          break;
      }
    });
  }

  /** Récupère les parametres via le REST Supabase (RLS lecture publique) */
  async function charger() {
    if (!SUPABASE_URL || !CLE_ANON) return;
    try {
      const reponse = await fetch(
        SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/parametres?select=cle,valeur',
        {
          headers: {
            apikey: CLE_ANON,
            Authorization: 'Bearer ' + CLE_ANON,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!reponse.ok) return;
      const donnees = await reponse.json();
      if (Array.isArray(donnees)) appliquer(donnees);
    } catch (_) {
      // Silencieux : les défauts config.js s'appliquent.
    }
  }

  charger();
})();