/**
 * PARAMÈTRES DU SITE — chargement dynamique
 * Portfolio Éditorial
 *
 * Charge les collections « parametres » et « seo » (Supabase, RLS lecture
 * publique) et fusionne les valeurs dans window.CONFIG AVANT/EN PARALLÈLE des
 * modules. Les valeurs de config.js servent de défauts : tout ce qui est réglé
 * dans l'admin (Paramètres / SEO) prend le dessus.
 *
 * Injecte aussi les zones d'identité du DOM marquées data-contenu="…"
 * (nom, intitulé, ville, email, réseaux, disponibilité…), les balises meta,
 * le titre de page et les données structurées JSON-LD. Aucune information
 * personnelle ne doit rester en dur dans les pages HTML.
 */

(function () {
  'use strict';

  var CONFIG = window.CONFIG || (window.CONFIG = {});
  var SUPABASE_URL = CONFIG.SUPABASE_URL || '';
  var CLE_ANON = CONFIG.SUPABASE_ANON_KEY || '';

  /** Correspondance « cle » (parametres / seo) → clé CONFIG */
  var CORRESPONDANCE = {
    /* Identité */
    site_nom:             'SITE_NOM',
    site_url:             'SITE_URL',
    site_description:     'SITE_DESCRIPTION',
    site_meta_description:'SITE_META_DESCRIPTION',
    description_defaut:   'SITE_META_DESCRIPTION',
    auteur_nom:           'AUTEUR_NOM',
    auteur_prenom:        'AUTEUR_PRENOM',
    auteur_nom_famille:   'AUTEUR_NOM_FAMILLE',
    auteur_titre:         'AUTEUR_TITRE',
    auteur_specialite:    'AUTEUR_SPECIALITE',
    auteur_statut:        'AUTEUR_STATUT',
    auteur_bio:           'AUTEUR_BIO',
    a_propos_description: 'A_PROPOS_DESCRIPTION',
    email_contact:        'AUTEUR_EMAIL',
    auteur_localisation:  'LOCALISATION',
    auteur_photo:         'AUTEUR_PHOTO',
    auteur_photo_alt:     'AUTEUR_PHOTO_ALT',
    annee_etudes:         'AUTEUR_ANNEE',
    annee_etudes_libelle: 'AUTEUR_ANNEE_LIBELLE',
    langue:               'SITE_LANGUE',
    locale:               'SITE_LOCALE',
    articles_par_page:    'ARTICLES_PAR_PAGE',

    /* Apparence */
    site_slogan:          'SITE_SLOGAN',
    site_edition:         'SITE_EDITION',
    numero_edition:       'SITE_NUMERO',
    site_footer_description: 'SITE_FOOTER_DESCRIPTION',
    site_citation:        'SITE_CITATION',
    carte_1_titre:        'CARTE_1_TITRE',
    carte_1_sous:         'CARTE_1_SOUS',
    carte_2_titre:        'CARTE_2_TITRE',
    carte_2_sous:         'CARTE_2_SOUS',
    carte_3_titre:        'CARTE_3_TITRE',
    carte_3_sous:         'CARTE_3_SOUS',

    /* Disponibilité */
    disponible:           'DISPONIBLE',
    disponibilite_libelle:'DISPONIBILITE_LIBELLE',
    disponibilite_texte:  'DISPONIBILITE_TEXTE',
    delai_reponse:        'DELAI_REPONSE',

    /* Réseaux et liens */
    github_url:           'GITHUB_URL',
    github_label:         'GITHUB_LABEL',
    linkedin_url:         'LINKEDIN_URL',
    linkedin_label:       'LINKEDIN_LABEL',
    twitter_handle:       'TWITTER_HANDLE',
    cv_url:               'CV_URL',

    /* Mentions légales */
    legal_editeur_description: 'LEGAL_EDITEUR_DESCRIPTION',
    legal_date_maj:            'LEGAL_DATE_MAJ',

    /* SEO */
    image_og_defaut:      'SEO_IMAGE_DEFAUT',
    indexation:           'SEO_INDEXATION',
    sitemap_auto:         'SEO_SITEMAP_AUTO',
    google_analytics_id:  'SEO_GOOGLE_ANALYTICS_ID',
    google_search_console:'SEO_GOOGLE_SEARCH_CONSOLE',
  };

  /** Clés pour lesquelles une valeur vide est significative (masquage) */
  var OPTIONNELLES = {
    GITHUB_URL: true, GITHUB_LABEL: true,
    LINKEDIN_URL: true, LINKEDIN_LABEL: true,
    TWITTER_HANDLE: true, TWITTER_URL: true, CV_URL: true,
    SITE_SLOGAN: true, AUTEUR_ANNEE: true, AUTEUR_ANNEE_LIBELLE: true,
    CARTE_1_TITRE: true, CARTE_1_SOUS: true,
    CARTE_2_TITRE: true, CARTE_2_SOUS: true,
    CARTE_3_TITRE: true, CARTE_3_SOUS: true,
  };

  /** Clés booléennes */
  var BOOLEENNES = {
    DISPONIBLE: true,
    SEO_INDEXATION: true,
    SEO_SITEMAP_AUTO: true,
  };

  /** Exécute la fonction dès que le DOM est prêt */
  function quandPret(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /** Applique les valeurs récupérées à window.CONFIG */
  function appliquer(lignes) {
    var recues = {};

    (lignes || []).forEach(function (p) {
      if (!p || !p.cle) return;
      var cible = CORRESPONDANCE[p.cle];
      if (!cible) return;

      var valeur = p.valeur;
      recues[cible] = true;

      if (BOOLEENNES[cible]) {
        CONFIG[cible] = String(valeur).trim().toLowerCase() === 'true';
        return;
      }

      if (cible === 'TWITTER_HANDLE' && typeof valeur === 'string') {
        valeur = valeur.trim().replace(/^@/, '');
      }

      var vide = String(valeur == null ? '' : valeur).trim() === '';
      if (vide && !OPTIONNELLES[cible]) {
        // Valeur absente en base : on conserve le défaut de config.js.
        return;
      }

      CONFIG[cible] = vide ? '' : valeur;
    });

    // Cohérence prénom / nom de famille / nom complet.
    if (recues.AUTEUR_NOM && !recues.AUTEUR_PRENOM && !recues.AUTEUR_NOM_FAMILLE) {
      var morceaux = String(CONFIG.AUTEUR_NOM || '').trim().split(/\s+/);
      if (morceaux.length) {
        CONFIG.AUTEUR_PRENOM = morceaux.shift();
        CONFIG.AUTEUR_NOM_FAMILLE = morceaux.join(' ');
      }
    }
    if (!CONFIG.AUTEUR_NOM || String(CONFIG.AUTEUR_NOM).trim() === '') {
      CONFIG.AUTEUR_NOM = [CONFIG.AUTEUR_PRENOM, CONFIG.AUTEUR_NOM_FAMILLE]
        .filter(Boolean).join(' ').trim();
    }
    if (CONFIG.TWITTER_HANDLE && !CONFIG.TWITTER_URL) {
      CONFIG.TWITTER_URL = 'https://x.com/' + CONFIG.TWITTER_HANDLE;
    }

    document.dispatchEvent(new CustomEvent('config:charge', { detail: CONFIG }));

    quandPret(function () {
      injecterDom();
      appliquerSeo();
    });
  }

  /** Remplit le texte d'une card du portrait (masque la card si vide) */
  function remplirCarte(zone, texte) {
    var carte = zone.closest('.etiquette-flottante');
    if (texte) {
      zone.textContent = texte;
      if (carte) carte.style.display = '';
    } else if (carte) {
      carte.style.display = 'none';
    }
  }

  /** Masque un élément si la valeur est vide */
  function afficher(zone, visible) {
    if (!zone) return;
    zone.style.display = visible ? '' : 'none';
  }

  /** Met à jour les zones d'identité du DOM marquées data-contenu="…" */
  function injecterDom() {
    var zones = document.querySelectorAll('[data-contenu]');

    zones.forEach(function (zone) {
      var type = zone.getAttribute('data-contenu');

      switch (type) {
        case 'site-nom':
          if (CONFIG.SITE_NOM) zone.textContent = CONFIG.SITE_NOM;
          break;
        case 'auteur-nom':
          if (CONFIG.AUTEUR_NOM) zone.textContent = CONFIG.AUTEUR_NOM;
          break;
        case 'auteur-prenom':
          if (CONFIG.AUTEUR_PRENOM) zone.textContent = CONFIG.AUTEUR_PRENOM;
          break;
        case 'initiales':
          var initiales = [CONFIG.AUTEUR_PRENOM, CONFIG.AUTEUR_NOM_FAMILLE]
            .filter(Boolean)
            .map(function (partie) { return String(partie).trim().charAt(0); })
            .join('')
            .toUpperCase();
          if (initiales) zone.textContent = initiales;
          break;
        case 'auteur-nom-famille':
          if (CONFIG.AUTEUR_NOM_FAMILLE) zone.textContent = CONFIG.AUTEUR_NOM_FAMILLE;
          break;
        case 'auteur-titre':
          if (CONFIG.AUTEUR_TITRE) zone.textContent = CONFIG.AUTEUR_TITRE;
          break;
        case 'auteur-statut':
          if (CONFIG.AUTEUR_STATUT) zone.textContent = CONFIG.AUTEUR_STATUT;
          break;
        case 'specialite':
          if (CONFIG.AUTEUR_SPECIALITE) zone.textContent = CONFIG.AUTEUR_SPECIALITE;
          break;
        case 'auteur-photo':
          if (zone.tagName === 'IMG') {
            if (CONFIG.AUTEUR_PHOTO) zone.setAttribute('src', CONFIG.AUTEUR_PHOTO);
            if (CONFIG.AUTEUR_PHOTO_ALT) zone.setAttribute('alt', CONFIG.AUTEUR_PHOTO_ALT);
          }
          break;
        case 'auteur-photo-alt':
          if (zone.tagName === 'IMG' && CONFIG.AUTEUR_PHOTO_ALT) zone.setAttribute('alt', CONFIG.AUTEUR_PHOTO_ALT);
          else if (CONFIG.AUTEUR_PHOTO_ALT) zone.textContent = CONFIG.AUTEUR_PHOTO_ALT;
          break;
        case 'site-description':
          if (zone.tagName === 'META') {
            if (CONFIG.SITE_DESCRIPTION) zone.setAttribute('content', CONFIG.SITE_DESCRIPTION);
          } else if (CONFIG.SITE_DESCRIPTION) {
            zone.textContent = CONFIG.SITE_DESCRIPTION;
          }
          break;
        case 'site-meta-description':
          if (CONFIG.SITE_META_DESCRIPTION) {
            if (zone.tagName === 'META') zone.setAttribute('content', CONFIG.SITE_META_DESCRIPTION);
            else zone.textContent = CONFIG.SITE_META_DESCRIPTION;
          }
          break;
        case 'site-edition':
          if (CONFIG.SITE_EDITION) zone.textContent = CONFIG.SITE_EDITION;
          break;
        case 'site-numero':
          if (CONFIG.SITE_NUMERO) zone.textContent = CONFIG.SITE_NUMERO;
          break;
        case 'footer-description':
          if (CONFIG.SITE_FOOTER_DESCRIPTION) zone.textContent = CONFIG.SITE_FOOTER_DESCRIPTION;
          break;
        case 'citation':
          if (CONFIG.SITE_CITATION) zone.textContent = CONFIG.SITE_CITATION;
          break;
        case 'slogan':
          afficher(zone, !!CONFIG.SITE_SLOGAN);
          if (CONFIG.SITE_SLOGAN) zone.textContent = CONFIG.SITE_SLOGAN;
          break;
        case 'annee-valeur':
          var item = zone.closest('.metrique-item');
          var sep = item && item.previousElementSibling;
          var sepSeparateur = sep && sep.classList.contains('metrique-separateur');
          if (CONFIG.AUTEUR_ANNEE) {
            zone.textContent = CONFIG.AUTEUR_ANNEE;
            if (item) item.style.display = '';
            if (sepSeparateur) sep.style.display = '';
          } else {
            if (item) item.style.display = 'none';
            if (sepSeparateur) sep.style.display = 'none';
          }
          break;
        case 'annee-libelle':
          if (CONFIG.AUTEUR_ANNEE_LIBELLE) zone.textContent = CONFIG.AUTEUR_ANNEE_LIBELLE;
          break;
        case 'carte-1-titre': remplirCarte(zone, CONFIG.CARTE_1_TITRE); break;
        case 'carte-1-sous':
          if (CONFIG.CARTE_1_SOUS) zone.textContent = CONFIG.CARTE_1_SOUS;
          break;
        case 'carte-2-titre': remplirCarte(zone, CONFIG.CARTE_2_TITRE); break;
        case 'carte-2-sous':
          if (CONFIG.CARTE_2_SOUS) zone.textContent = CONFIG.CARTE_2_SOUS;
          break;
        case 'carte-3-titre': remplirCarte(zone, CONFIG.CARTE_3_TITRE); break;
        case 'carte-3-sous':
          if (CONFIG.CARTE_3_SOUS) zone.textContent = CONFIG.CARTE_3_SOUS;
          break;
        case 'auteur-bio':
          if (CONFIG.AUTEUR_BIO) zone.textContent = CONFIG.AUTEUR_BIO;
          break;
        case 'a-propos-description':
          if (CONFIG.A_PROPOS_DESCRIPTION) {
            var paragraphes = String(CONFIG.A_PROPOS_DESCRIPTION).split('\n')
              .map(function (ligne) { return ligne.trim(); })
              .filter(function (ligne) { return ligne !== ''; });
            if (paragraphes.length) {
              zone.textContent = '';
              paragraphes.forEach(function (ligne) {
                var par = document.createElement('p');
                par.textContent = ligne;
                zone.appendChild(par);
              });
            }
          }
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
        case 'email-texte':
          if (CONFIG.AUTEUR_EMAIL) zone.textContent = CONFIG.AUTEUR_EMAIL;
          break;
        case 'github':
          if (CONFIG.GITHUB_URL && zone.tagName === 'A') zone.setAttribute('href', CONFIG.GITHUB_URL);
          afficher(zone, !!CONFIG.GITHUB_URL);
          break;
        case 'github-label':
          if (CONFIG.GITHUB_LABEL) zone.textContent = CONFIG.GITHUB_LABEL;
          break;
        case 'linkedin':
          if (CONFIG.LINKEDIN_URL && zone.tagName === 'A') zone.setAttribute('href', CONFIG.LINKEDIN_URL);
          afficher(zone, !!CONFIG.LINKEDIN_URL);
          break;
        case 'linkedin-label':
          if (CONFIG.LINKEDIN_LABEL) zone.textContent = CONFIG.LINKEDIN_LABEL;
          break;
        case 'twitter':
          if (CONFIG.TWITTER_URL && zone.tagName === 'A') zone.setAttribute('href', CONFIG.TWITTER_URL);
          afficher(zone, !!CONFIG.TWITTER_URL);
          break;
        case 'twitter-label':
          if (CONFIG.TWITTER_URL) {
            zone.textContent = CONFIG.TWITTER_HANDLE ? '@' + CONFIG.TWITTER_HANDLE : zone.textContent;
          }
          break;
        case 'cv':
          if (zone.tagName === 'A' && CONFIG.CV_URL) zone.setAttribute('href', CONFIG.CV_URL);
          afficher(zone, !!CONFIG.CV_URL);
          break;
        case 'disponible':
          afficher(zone, CONFIG.DISPONIBLE !== false);
          break;
        case 'disponibilite-libelle':
          if (CONFIG.DISPONIBILITE_LIBELLE) zone.textContent = CONFIG.DISPONIBILITE_LIBELLE;
          afficher(zone.closest('[data-contenu="disponible"]') || zone, CONFIG.DISPONIBLE !== false);
          break;
        case 'disponibilite-texte':
          if (CONFIG.DISPONIBILITE_TEXTE) zone.textContent = CONFIG.DISPONIBILITE_TEXTE;
          break;
        case 'delai-reponse':
          if (CONFIG.DELAI_REPONSE) zone.textContent = CONFIG.DELAI_REPONSE;
          break;
        case 'legal-editeur-description':
          if (CONFIG.LEGAL_EDITEUR_DESCRIPTION) zone.textContent = CONFIG.LEGAL_EDITEUR_DESCRIPTION;
          break;
        case 'date-maj':
          if (CONFIG.LEGAL_DATE_MAJ) zone.textContent = CONFIG.LEGAL_DATE_MAJ;
          break;
        case 'annee-copyright':
          zone.textContent = new Date().getFullYear();
          break;
      }
    });
  }

  /** Sélectionne (ou crée) une balise meta */
  function meta(attribut, nom, contenu) {
    if (contenu == null) return;
    var sel = 'meta[' + attribut + '="' + nom + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribut, nom);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contenu);
  }

  /** URL absolue à partir de SITE_URL */
  function urlAbsolue(chemin) {
    if (!chemin) return '';
    if (/^https?:\/\//i.test(chemin)) return chemin;
    var base = String(CONFIG.SITE_URL || '').replace(/\/+$/, '') || window.location.origin;
    return base + '/' + String(chemin).replace(/^\/+/, '');
  }

  /** Calcule le titre de la page à partir de data-titre (sur <html>) */
  function titrePage() {
    var modele = document.documentElement.getAttribute('data-titre') || '';
    var nom = CONFIG.SITE_NOM || '';
    var auteur = CONFIG.AUTEUR_NOM || '';

    if (modele.indexOf('{auteur}') !== -1) {
      return modele.replace(/\{auteur\}/g, auteur).replace(/\{site\}/g, nom).trim();
    }
    if (modele.indexOf('{site}') !== -1) {
      return modele.replace(/\{site\}/g, nom).trim();
    }
    if (!modele) return nom;
    return modele + ' — ' + nom;
  }

  /** Met à jour title, meta, canonical et JSON-LD depuis CONFIG */
  function appliquerSeo() {
    document.documentElement.setAttribute('lang', CONFIG.SITE_LANGUE || 'fr');

    // Pages dont le SEO est piloté par un autre module (ex. blog.js).
    if (document.documentElement.hasAttribute('data-seo-manuel')) return;

    var titre = titrePage();
    if (titre) document.title = titre;

    var description = document.documentElement.getAttribute('data-description')
      || CONFIG.SITE_META_DESCRIPTION
      || CONFIG.SITE_DESCRIPTION
      || '';

    var chemin = document.documentElement.getAttribute('data-url') || window.location.pathname;
    var url = urlAbsolue(chemin);
    var image = urlAbsolue(
      document.documentElement.getAttribute('data-image')
      || CONFIG.SEO_IMAGE_DEFAUT
    );

    meta('name', 'author', CONFIG.AUTEUR_NOM);
    meta('name', 'description', description);
    meta('name', 'robots', CONFIG.SEO_INDEXATION === false
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large');

    meta('property', 'og:site_name', CONFIG.SITE_NOM);
    meta('property', 'og:locale', CONFIG.SITE_LOCALE || 'fr_FR');
    meta('property', 'og:url', url);
    meta('property', 'og:title', titre);
    meta('property', 'og:description', description);
    meta('property', 'og:image', image);
    meta('property', 'og:image:alt', titre);

    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', titre);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', image);

    var handle = CONFIG.TWITTER_HANDLE ? String(CONFIG.TWITTER_HANDLE).replace(/^@/, '') : '';
    if (handle) {
      meta('name', 'twitter:site', '@' + handle);
      meta('name', 'twitter:creator', '@' + handle);
    }

    var canonique = document.querySelector('link[rel="canonical"]');
    if (canonique) canonique.setAttribute('href', url);
    else if (url) {
      canonique = document.createElement('link');
      canonique.rel = 'canonical';
      canonique.href = url;
      document.head.appendChild(canonique);
    }

    synchroniserJsonLd(url, titre, description, image);
  }

  /** Met à jour les données structurées JSON-LD existantes (ou en crée) */
  function synchroniserJsonLd(url, titre, description, image) {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    var trouve = false;

    scripts.forEach(function (script) {
      var brut = script.textContent;
      if (!brut) return;
      try {
        var objet = JSON.parse(brut);
        if (mettreAJourJsonLd(objet, url, titre, description, image)) {
          script.textContent = JSON.stringify(objet);
          trouve = true;
        }
      } catch (_) { /* JSON-LD non exploitable : laissé tel quel */ }
    });

    if (!trouve && CONFIG.AUTEUR_NOM) {
      var graphe = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': urlAbsolue('/') + '#website',
            'name': CONFIG.SITE_NOM,
            'url': urlAbsolue('/'),
            'description': CONFIG.SITE_DESCRIPTION,
            'inLanguage': CONFIG.SITE_LANGUE || 'fr',
          },
          {
            '@type': 'Person',
            '@id': urlAbsolue('/') + '#personne',
            'name': CONFIG.AUTEUR_NOM,
            'url': urlAbsolue('/'),
            'jobTitle': CONFIG.AUTEUR_TITRE,
            'description': CONFIG.AUTEUR_BIO,
            'sameAs': [CONFIG.GITHUB_URL, CONFIG.LINKEDIN_URL, CONFIG.TWITTER_URL].filter(Boolean),
            'image': { '@type': 'ImageObject', 'url': urlAbsolue(CONFIG.AUTEUR_PHOTO) },
          },
        ],
      };
      var script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(graphe);
      document.head.appendChild(script);
    }
  }

  /** Parcourt un objet JSON-LD et met à jour les champs connus */
  function mettreAJourJsonLd(objet, url, titre, description, image) {
    var modifie = false;

    function parcourir(noeud) {
      if (!noeud || typeof noeud !== 'object') return;

      if (Array.isArray(noeud)) {
        noeud.forEach(parcourir);
        return;
      }

      var type = noeud['@type'];
      if (type === 'Person') {
        if (CONFIG.AUTEUR_NOM) { noeud.name = CONFIG.AUTEUR_NOM; modifie = true; }
        if (CONFIG.AUTEUR_TITRE) { noeud.jobTitle = CONFIG.AUTEUR_TITRE; modifie = true; }
        if (CONFIG.AUTEUR_BIO) { noeud.description = CONFIG.AUTEUR_BIO; modifie = true; }
        noeud.url = urlAbsolue('/');
        var sameAs = [CONFIG.GITHUB_URL, CONFIG.LINKEDIN_URL, CONFIG.TWITTER_URL].filter(Boolean);
        noeud.sameAs = sameAs;
        if (CONFIG.AUTEUR_PHOTO) {
          noeud.image = { '@type': 'ImageObject', 'url': urlAbsolue(CONFIG.AUTEUR_PHOTO) };
        }
        modifie = true;
      }

      if (type === 'WebSite' || type === 'Organization') {
        if (CONFIG.SITE_NOM) { noeud.name = CONFIG.SITE_NOM; modifie = true; }
        if (type === 'WebSite' && CONFIG.SITE_DESCRIPTION) {
          noeud.description = CONFIG.SITE_DESCRIPTION;
          modifie = true;
        }
      }

      if (type === 'Blog') {
        noeud.name = noeud.name || ('Blog — ' + CONFIG.SITE_NOM);
        if (CONFIG.SITE_NOM && String(noeud.name).indexOf('—') !== -1) {
          noeud.name = 'Blog — ' + CONFIG.SITE_NOM;
        }
        if (CONFIG.SITE_DESCRIPTION) noeud.description = CONFIG.SITE_DESCRIPTION;
        noeud.url = url;
        modifie = true;
      }

      Object.keys(noeud).forEach(function (cle) {
        if (cle === 'publisher' && noeud[cle] && noeud[cle]['@type'] === 'Person') {
          if (CONFIG.AUTEUR_NOM) noeud[cle].name = CONFIG.AUTEUR_NOM;
          modifie = true;
        }
        parcourir(noeud[cle]);
      });
    }

    parcourir(objet);
    return modifie;
  }

  /** Récupère une collection via le REST Supabase (RLS lecture publique) */
  async function recuperer(collection) {
    if (!SUPABASE_URL || !CLE_ANON) return [];
    try {
      const reponse = await fetch(
        SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + collection + '?select=cle,valeur',
        {
          headers: {
            apikey: CLE_ANON,
            Authorization: 'Bearer ' + CLE_ANON,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!reponse.ok) return [];
      const donnees = await reponse.json();
      return Array.isArray(donnees) ? donnees : [];
    } catch (_) {
      return [];
    }
  }

  /** Chargement : « seo » puis « parametres » (priorité aux paramètres) */
  async function charger() {
    try {
      const [parametres, seo] = await Promise.all([
        recuperer('parametres'),
        recuperer('seo'),
      ]);

      if (parametres.length || seo.length) appliquer(seo.concat(parametres));
    } finally {
      window.__CONFIG_PRET__ = true;
      document.dispatchEvent(new CustomEvent('config:pret', { detail: CONFIG }));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger, { once: true });
  } else {
    charger();
  }
})();
