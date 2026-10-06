/**
 * MOTEUR SEO
 * Portfolio Éditorial — Métadonnées dynamiques, JSON-LD, OpenGraph
 *
 * Gère l'injection de toutes les balises SEO de manière centralisée.
 * Cible : Lighthouse SEO 100 — Performance 95+ — Accessibilité 95+
 *
 * Fonctionnalités :
 * - Métadonnées HTML5 sémantiques
 * - OpenGraph (Facebook, LinkedIn)
 * - Twitter Cards
 * - JSON-LD structuré (Article, Person, WebSite, BreadcrumbList)
 * - URLs canoniques
 * - Gestion des métadonnées de pagination
 * - Génération de sitemap XML
 * - robots.txt dynamique
 */

'use strict';

/** Configuration SEO globale (lue depuis window.CONFIG) */
const CFG = window.CONFIG || {};

const SITE = Object.freeze({
  nom:         CFG.SITE_NOM          || 'Portfolio Éditorial',
  url:         CFG.SITE_URL          || window.location.origin,
  description: CFG.SITE_DESCRIPTION  || 'Portfolio et blog éditorial professionnel',
  auteur:      CFG.AUTEUR_NOM        || 'Auteur',
  langue:      'fr',
  twitter:     CFG.TWITTER_HANDLE    || '',
  locale:      'fr_FR',
  type:        'website',
});

class MoteurSEO {
  constructor() {
    this._metasGerées = new Set(); // Évite les doublons
  }

  // ============================================================
  // ENTRÉE PRINCIPALE
  // ============================================================

  /**
   * Configure toutes les balises SEO d'une page
   * @param {Object} config - Configuration SEO de la page
   * @param {string} config.titre - Titre de la page
   * @param {string} [config.description] - Description méta
   * @param {string} [config.url] - URL canonique
   * @param {string} [config.image] - URL image OG
   * @param {string} [config.type] - Type OG ('article'|'website'|'profile')
   * @param {string} [config.datePublication] - ISO date
   * @param {string} [config.dateModification] - ISO date
   * @param {string[]} [config.tags] - Mots-clés
   * @param {Object} [config.auteur] - {nom, url}
   * @param {Array}  [config.fil] - Fil d'Ariane [{nom, url}]
   * @param {Object} [config.pagination] - {page, total, urlPrecedente, urlSuivante}
   * @param {boolean} [config.indexer] - Autoriser l'indexation (défaut: true)
   * @param {string} [config.jsonLd] - Type de schéma structuré
   */
  configurer(config) {
    const cfg = this._normaliser(config);

    this._definirTitre(cfg);
    this._definirMetaDescription(cfg);
    this._definirCanonique(cfg);
    this._definirRobots(cfg);
    this._definirOpenGraph(cfg);
    this._definirTwitterCard(cfg);
    this._definirMetaDivers(cfg);
    this._definirMetaPagination(cfg);
    this._injecterJsonLd(cfg);
    this._definirAttributsHtml();
  }

  // ============================================================
  // TITRE
  // ============================================================

  _definirTitre(cfg) {
    const titreProduit = cfg.titre === SITE.nom
      ? SITE.nom
      : `${cfg.titre} — ${SITE.nom}`;

    document.title = titreProduit;
    this._meta('property', 'og:title', cfg.titre);
    this._meta('name', 'twitter:title', cfg.titre);
  }

  // ============================================================
  // DESCRIPTION
  // ============================================================

  _definirMetaDescription(cfg) {
    if (!cfg.description) return;
    this._meta('name', 'description', cfg.description);
    this._meta('property', 'og:description', cfg.description);
    this._meta('name', 'twitter:description', cfg.description);
  }

  // ============================================================
  // URL CANONIQUE
  // ============================================================

  _definirCanonique(cfg) {
    // Supprime le canonique existant
    const existant = document.querySelector('link[rel="canonical"]');
    if (existant) existant.remove();

    const lien = document.createElement('link');
    lien.rel  = 'canonical';
    lien.href = cfg.url;
    document.head.appendChild(lien);

    this._meta('property', 'og:url', cfg.url);
  }

  // ============================================================
  // ROBOTS
  // ============================================================

  _definirRobots(cfg) {
    const contenu = cfg.indexer !== false
      ? 'index, follow, max-snippet:-1, max-image-preview:large'
      : 'noindex, nofollow';
    this._meta('name', 'robots', contenu);
  }

  // ============================================================
  // OPEN GRAPH
  // ============================================================

  _definirOpenGraph(cfg) {
    this._meta('property', 'og:type',            cfg.type);
    this._meta('property', 'og:site_name',       SITE.nom);
    this._meta('property', 'og:locale',          SITE.locale);

    if (cfg.image) {
      this._meta('property', 'og:image',         cfg.image);
      this._meta('property', 'og:image:width',   '1200');
      this._meta('property', 'og:image:height',  '630');
      this._meta('property', 'og:image:alt',     cfg.titre);
    }

    if (cfg.type === 'article') {
      if (cfg.datePublication) {
        this._meta('property', 'article:published_time', cfg.datePublication);
      }
      if (cfg.dateModification) {
        this._meta('property', 'article:modified_time',  cfg.dateModification);
      }
      if (cfg.auteur?.nom) {
        this._meta('property', 'article:author', cfg.auteur.nom);
      }
      if (cfg.tags?.length) {
        cfg.tags.forEach(tag => {
          this._meta('property', 'article:tag', tag, false); // Permet doublons
        });
      }
    }
  }

  // ============================================================
  // TWITTER CARDS
  // ============================================================

  _definirTwitterCard(cfg) {
    const type = cfg.image ? 'summary_large_image' : 'summary';
    this._meta('name', 'twitter:card',    type);

    // Handle Twitter : uniquement si un handle valide est configuré.
    // Jamais de pseudo inventé à partir du nom d'auteur.
    const handle = SITE.twitter ? SITE.twitter.replace(/^@/, '') : '';
    if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      this._meta('name', 'twitter:site',    '@' + handle);
      this._meta('name', 'twitter:creator', '@' + handle);
    }

    if (cfg.image) {
      this._meta('name', 'twitter:image',     cfg.image);
      this._meta('name', 'twitter:image:alt', cfg.titre);
    }
  }

  // ============================================================
  // MÉTADONNÉES DIVERSES
  // ============================================================

  _definirMetaDivers(cfg) {
    this._meta('name', 'author',     cfg.auteur?.nom || SITE.auteur);
    this._meta('name', 'generator',  'Portfolio Éditorial CMS');
    this._meta('name', 'theme-color', '#0A0A0A');

    if (cfg.tags?.length) {
      this._meta('name', 'keywords', cfg.tags.join(', '));
    }
  }

  // ============================================================
  // PAGINATION (rel prev/next)
  // ============================================================

  _definirMetaPagination(cfg) {
    // Nettoie les liens de pagination existants
    document.querySelectorAll('link[rel="prev"], link[rel="next"]')
      .forEach(el => el.remove());

    if (!cfg.pagination) return;

    if (cfg.pagination.urlPrecedente) {
      const lien = document.createElement('link');
      lien.rel  = 'prev';
      lien.href = cfg.pagination.urlPrecedente;
      document.head.appendChild(lien);
    }
    if (cfg.pagination.urlSuivante) {
      const lien = document.createElement('link');
      lien.rel  = 'next';
      lien.href = cfg.pagination.urlSuivante;
      document.head.appendChild(lien);
    }
  }

  // ============================================================
  // JSON-LD — DONNÉES STRUCTURÉES
  // ============================================================

  _injecterJsonLd(cfg) {
    // Supprime les scripts JSON-LD existants gérés par ce module
    document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove());

    const schemas = [
      this._schemaWebSite(),
    ];

    // Schéma Fil d'Ariane
    if (cfg.fil?.length > 0) {
      schemas.push(this._schemaFilAriane(cfg.fil));
    }

    // Schéma spécifique au type de page
    if (cfg.type === 'article' && cfg.article) {
      schemas.push(this._schemaArticle(cfg));
    } else if (cfg.jsonLd === 'personne' || cfg.type === 'profile') {
      schemas.push(this._schemaPersonne());
    } else {
      schemas.push(this._schemaPageWeb(cfg));
    }

    // Injecte chaque schéma
    schemas.filter(Boolean).forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoLd = 'true';
      script.textContent = JSON.stringify(schema, null, 0);
      document.head.appendChild(script);
    });
  }

  _schemaWebSite() {
    return {
      '@context': 'https://schema.org',
      '@type':    'WebSite',
      '@id':      `${SITE.url}/#website`,
      name:       SITE.nom,
      url:        SITE.url,
      description: SITE.description,
      inLanguage: SITE.langue,
      potentialAction: {
        '@type':       'SearchAction',
        target:        { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/blog/?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  _schemaPageWeb(cfg) {
    return {
      '@context':  'https://schema.org',
      '@type':     'WebPage',
      '@id':       cfg.url,
      url:         cfg.url,
      name:        cfg.titre,
      description: cfg.description,
      inLanguage:  SITE.langue,
      isPartOf:    { '@id': `${SITE.url}/#website` },
      ...(cfg.image && { image: { '@type': 'ImageObject', url: cfg.image } }),
      ...(cfg.dateModification && { dateModified: cfg.dateModification }),
    };
  }

  _schemaArticle(cfg) {
    return {
      '@context':         'https://schema.org',
      '@type':            'Article',
      '@id':              cfg.url,
      headline:           cfg.titre,
      description:        cfg.description,
      url:                cfg.url,
      datePublished:      cfg.datePublication,
      dateModified:       cfg.dateModification || cfg.datePublication,
      inLanguage:         SITE.langue,
      isPartOf:           { '@id': `${SITE.url}/#website` },
      image:              cfg.image ? [{
        '@type': 'ImageObject',
        url:     cfg.image,
        width:   1200,
        height:  630,
      }] : undefined,
      author: {
        '@type': 'Person',
        name:    cfg.auteur?.nom || SITE.auteur,
        url:     cfg.auteur?.url || SITE.url,
      },
      publisher: {
        '@type': 'Organization',
        name:    SITE.nom,
        url:     SITE.url,
        logo: {
          '@type': 'ImageObject',
          url:     (CFG.AUTEUR_PHOTO ? SITE.url.replace(/\/+$/, '') + CFG.AUTEUR_PHOTO : `${SITE.url}/assets/og-defaut.jpg`),
        },
      },
      keywords: cfg.tags?.join(', '),
      wordCount: cfg.nombreMots,
      articleSection: cfg.categorie,
      mainEntityOfPage: { '@type': 'WebPage', '@id': cfg.url },
    };
  }

  _schemaPersonne() {
    return {
      '@context':   'https://schema.org',
      '@type':      'Person',
      '@id':        `${SITE.url}/#personne`,
      name:         CFG.AUTEUR_NOM        || SITE.auteur,
      description:  CFG.AUTEUR_BIO        || SITE.description,
      url:          SITE.url,
      sameAs: [
        CFG.LINKEDIN_URL,
        CFG.GITHUB_URL,
        CFG.TWITTER_URL,
      ].filter(Boolean),
      jobTitle:     CFG.AUTEUR_TITRE      || '',
      worksFor: CFG.AUTEUR_ENTREPRISE ? {
        '@type': 'Organization',
        name:    CFG.AUTEUR_ENTREPRISE,
      } : undefined,
      image: CFG.AUTEUR_PHOTO ? {
        '@type': 'ImageObject',
        url:     CFG.AUTEUR_PHOTO,
      } : undefined,
      knowsLanguage: ['fr', 'en'],
    };
  }

  _schemaFilAriane(fil) {
    return {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: fil.map((element, index) => ({
        '@type':  'ListItem',
        position: index + 1,
        name:     element.nom,
        item:     element.url ? `${SITE.url}${element.url}` : undefined,
      })),
    };
  }

  // ============================================================
  // ATTRIBUTS HTML
  // ============================================================

  _definirAttributsHtml() {
    document.documentElement.lang = SITE.langue;
    document.documentElement.setAttribute('itemscope', '');
    document.documentElement.setAttribute('itemtype', 'https://schema.org/WebPage');
  }

  // ============================================================
  // FIL D'ARIANE DOM
  // ============================================================

  /**
   * Génère le HTML du fil d'Ariane
   * @param {Array} fil - [{nom, url}]
   * @returns {string} HTML
   */
  genererFilAriane(fil) {
    if (!fil?.length) return '';

    const elements = fil.map((el, i) => {
      const dernier = i === fil.length - 1;
      if (dernier) {
        return `<li class="fil-ariane-element" aria-current="page">
          <span class="fil-ariane-courant">${this._echapper(el.nom)}</span>
        </li>`;
      }
      return `<li class="fil-ariane-element">
        <a class="fil-ariane-lien" href="${this._echapper(el.url)}">${this._echapper(el.nom)}</a>
        <span class="fil-ariane-separateur" aria-hidden="true">/</span>
      </li>`;
    });

    return `<nav aria-label="Fil d'Ariane">
      <ol class="fil-ariane" role="list"
          itemscope itemtype="https://schema.org/BreadcrumbList">
        ${elements.join('\n')}
      </ol>
    </nav>`;
  }

  // ============================================================
  // GÉNÉRATION DE SITEMAP
  // ============================================================

  /**
   * Génère le sitemap XML depuis les données
   * @param {Array} pages - [{url, dateModification, priorite, frequence}]
   * @returns {string} XML du sitemap
   */
  genererSitemap(pages) {
    const entrees = pages.map(page => `  <url>
    <loc>${this._echapper(page.url)}</loc>
    ${page.dateModification ? `<lastmod>${new Date(page.dateModification).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${page.frequence || 'monthly'}</changefreq>
    <priority>${page.priorite !== undefined ? page.priorite : 0.8}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entrees}
</urlset>`;
  }

  /**
   * Génère robots.txt
   * @param {string[]} [cheminsInterdits] 
   * @returns {string}
   */
  genererRobots(cheminsInterdits = ['/admin/', '/api/']) {
    const interdits = cheminsInterdits.map(c => `Disallow: ${c}`).join('\n');
    return `User-agent: *\nAllow: /\n${interdits}\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
  }

  // ============================================================
  // UTILITAIRES PRIVÉS
  // ============================================================

  /**
   * Normalise et complète la configuration SEO
   * @param {Object} cfg 
   * @returns {Object}
   */
  _normaliser(cfg) {
    return {
      titre:            cfg.titre || SITE.nom,
      description:      this._tronquer(cfg.description || SITE.description, 160),
      url:              cfg.url || window.location.href.split('?')[0],
      image:            cfg.image || `${SITE.url}/assets/og-defaut.jpg`,
      type:             cfg.type || 'website',
      datePublication:  cfg.datePublication || null,
      dateModification: cfg.dateModification || null,
      tags:             cfg.tags || [],
      auteur:           cfg.auteur || { nom: SITE.auteur, url: SITE.url },
      fil:              cfg.fil || [],
      pagination:       cfg.pagination || null,
      indexer:          cfg.indexer !== false,
      jsonLd:           cfg.jsonLd || null,
      categorie:        cfg.categorie || null,
      nombreMots:       cfg.nombreMots || null,
      article:          cfg.article || null,
    };
  }

  /**
   * Crée ou met à jour une balise méta
   * @param {string} attribut - 'name' | 'property'
   * @param {string} valeurAttribut
   * @param {string} contenu
   * @param {boolean} [unique] - Une seule balise par attribut (défaut: true)
   */
  _meta(attribut, valeurAttribut, contenu, unique = true) {
    if (!contenu) return;

    const cle = `${attribut}:${valeurAttribut}`;

    if (unique && this._metasGerées.has(cle)) {
      // Met à jour l'existante
      const existante = document.querySelector(`meta[${attribut}="${valeurAttribut}"]`);
      if (existante) {
        existante.setAttribute('content', contenu);
        return;
      }
    }

    // Supprime l'existante si unique
    if (unique) {
      document.querySelector(`meta[${attribut}="${valeurAttribut}"]`)?.remove();
    }

    const meta = document.createElement('meta');
    meta.setAttribute(attribut, valeurAttribut);
    meta.setAttribute('content', contenu);
    document.head.appendChild(meta);
    this._metasGerées.add(cle);
  }

  /**
   * Tronque un texte à une longueur maximale
   * @param {string} texte 
   * @param {number} max 
   * @returns {string}
   */
  _tronquer(texte, max) {
    if (!texte) return '';
    if (texte.length <= max) return texte;
    return texte.slice(0, max - 1).replace(/\s\S*$/, '') + '\u2026';
  }

  /**
   * Échappe les caractères HTML
   * @param {string} texte 
   * @returns {string}
   */
  _echapper(texte) {
    if (!texte) return '';
    return String(texte)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Singleton exporté
const seo = new MoteurSEO();
export default seo;
