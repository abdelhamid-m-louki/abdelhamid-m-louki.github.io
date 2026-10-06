/**
 * MOTEUR DE BLOG
 * Portfolio Éditorial — Listing, catégories, recherche, pagination
 *
 * Gère l'affichage du blog public :
 * - Listing paginé des articles
 * - Filtrage par catégorie et tag
 * - Recherche en temps réel (debounce)
 * - Pagination avec URLs propres
 * - SEO dynamique par page/catégorie
 * - Fil d'Ariane
 * - Articles connexes
 */

'use strict';

import stockage, { COLLECTIONS } from '../storage/storage-manager.js';
import seo from '../seo/seo.js';
import { echapper, formaterDate, Transformateurs } from '../app.js';

/** Configuration de pagination */
const CONFIG_PAGINATION = Object.freeze({
  ARTICLES_PAR_PAGE: 9,
  DEBOUNCE_RECHERCHE: 350, // ms
});

class MoteurBlog {
  constructor() {
    this._page         = 1;
    this._categorie    = null;
    this._tag          = null;
    this._recherche    = '';
    this._total        = 0;
    this._timerDebounce = null;
    this._chargement   = false;
  }

  // ============================================================
  // INITIALISATION — PAGE LISTING
  // ============================================================

  async initialiserListingBlog() {
    this._lireParametresURL();
    this._configurerRecherche();
    this._configurerCategorieNav();

    await Promise.all([
      this._chargerCategories(),
      this._chargerArticles(),
    ]);

    this._configurerSEOListing();
    this._initialiserObservateurs();
  }

  // ============================================================
  // INITIALISATION — PAGE ARTICLE
  // ============================================================

  async initialiserPageArticle() {
    const slug = this._obtenirSlugURL();
    if (!slug) {
      this._afficherErreur404();
      return;
    }

    try {
      const article = await stockage.obtenirParChamp(
        COLLECTIONS.ARTICLES, 'slug', slug
      );

      if (!article || article.statut !== 'publié') {
        this._afficherErreur404();
        return;
      }

      this._rendrePageArticle(article);
      this._configurerSEOArticle(article);
      this._configurerProgressionLecture();
      this._configurerTableMatieres();
      await this._chargerArticlesConnexes(article);

      // Incrémente le compteur de vues
      this._incrementerVues(article.id);

    } catch (erreur) {
      console.error('[Blog] Erreur chargement article :', erreur.message);
      this._afficherErreur404();
    }
  }

  // ============================================================
  // LECTURE URL
  // ============================================================

  _lireParametresURL() {
    const params = new URLSearchParams(window.location.search);
    this._page       = parseInt(params.get('page') || '1', 10);
    this._categorie  = params.get('cat') || null;
    this._tag        = params.get('tag') || null;
    this._recherche  = params.get('q')   || '';
  }

  _obtenirSlugURL() {
    // /blog/article.html?slug=mon-article
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || null;
  }

  // ============================================================
  // CHARGEMENT ARTICLES
  // ============================================================

  async _chargerArticles() {
    if (this._chargement) return;
    this._chargement = true;

    const conteneur = document.getElementById('grille-articles');
    if (!conteneur) return;

    this._afficherChargement(conteneur);

    try {
      const options = {
        filtres: { statut: 'publié' },
        parPage: CONFIG_PAGINATION.ARTICLES_PAR_PAGE,
        page:    this._page,
        tri:     'date_publication',
        ordre:   'desc',
      };

      // Filtres additionnels
      if (this._categorie) options.filtres.categorie = this._categorie;
      if (this._tag)       options.filtres.tags_contient = this._tag;

      // Recherche
      if (this._recherche.length >= 2) {
        options.recherche       = this._recherche;
        options.champsRecherche = ['titre', 'extrait', 'contenu'];
        options.filtres         = { statut: 'publié' };
      }

      const { donnees, total, page } = await stockage.obtenirTous(
        COLLECTIONS.ARTICLES, options
      );

      this._total = total;
      this._page  = page;

      if (!donnees?.length) {
        conteneur.innerHTML = this._genererMessageVide();
      } else {
        conteneur.innerHTML = donnees.map((art, i) =>
          this._genererCarteArticle(art, i)
        ).join('');
      }

      this._rendrePagination();
      this._mettreAJourCompteurResultats(total);

    } catch (erreur) {
      console.error('[Blog] Erreur chargement articles :', erreur.message);
      conteneur.innerHTML = this._genererErreur();
    } finally {
      this._chargement = false;
    }
  }

  // ============================================================
  // CHARGEMENT CATÉGORIES
  // ============================================================

  async _chargerCategories() {
    const conteneur = document.getElementById('nav-categories');
    if (!conteneur) return;

    try {
      const { donnees } = await stockage.obtenirTous(COLLECTIONS.CATEGORIES, {
        tri: 'nom',
        ordre: 'asc',
      });

      const lienTous = `
        <a href="/blog/index.html"
           class="pilule-categorie ${!this._categorie ? 'actif' : ''}"
           aria-label="Tous les articles"
           ${!this._categorie ? 'aria-current="true"' : ''}>
          Tous
        </a>
      `;

      const liens = donnees.map(cat => `
        <a href="/blog/index.html?cat=${encodeURIComponent(cat.slug)}"
           class="pilule-categorie ${this._categorie === cat.slug ? 'actif' : ''}"
           aria-label="${echapper(cat.nom)} — ${cat.nombre_articles || 0} articles"
           ${this._categorie === cat.slug ? 'aria-current="true"' : ''}>
          ${echapper(cat.nom)}
          <span class="pilule-compteur" aria-hidden="true">${cat.nombre_articles || 0}</span>
        </a>
      `).join('');

      conteneur.innerHTML = lienTous + liens;

    } catch (_) {
      // Silencieux — catégories non critiques
    }
  }

  // ============================================================
  // RECHERCHE
  // ============================================================

  _configurerRecherche() {
    const champRecherche = document.getElementById('recherche-blog');
    if (!champRecherche) return;

    // Pré-remplir depuis l'URL
    if (this._recherche) champRecherche.value = this._recherche;

    champRecherche.addEventListener('input', (e) => {
      clearTimeout(this._timerDebounce);
      this._timerDebounce = setTimeout(async () => {
        this._recherche = e.target.value.trim();
        this._page      = 1;
        this._mettreAJourURL();
        await this._chargerArticles();
      }, CONFIG_PAGINATION.DEBOUNCE_RECHERCHE);
    });

    // Vider la recherche
    const btnEffacer = document.getElementById('btn-effacer-recherche');
    btnEffacer?.addEventListener('click', () => {
      champRecherche.value = '';
      this._recherche      = '';
      this._page           = 1;
      this._mettreAJourURL();
      this._chargerArticles();
      champRecherche.focus();
    });
  }

  // ============================================================
  // NAVIGATION CATÉGORIE
  // ============================================================

  _configurerCategorieNav() {
    document.addEventListener('click', (e) => {
      const pilule = e.target.closest('.pilule-categorie');
      if (!pilule) return;

      e.preventDefault();
      const url  = new URL(pilule.href);
      const cat  = url.searchParams.get('cat');

      this._categorie = cat || null;
      this._page      = 1;
      this._recherche = '';

      this._mettreAJourURL();
      this._chargerCategories();
      this._chargerArticles();
      this._configurerSEOListing();
    });
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  _rendrePagination() {
    const conteneur = document.getElementById('pagination-blog');
    if (!conteneur) return;

    const totalPages = Math.ceil(this._total / CONFIG_PAGINATION.ARTICLES_PAR_PAGE);

    if (totalPages <= 1) {
      conteneur.innerHTML = '';
      return;
    }

    const boutons = [];

    // Précédent
    boutons.push(`
      <button class="page-btn" data-page="${this._page - 1}"
              ${this._page <= 1 ? 'disabled aria-disabled="true"' : ''}
              aria-label="Page précédente">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
    `);

    // Numéros de pages
    const plage = this._calculerPlage(this._page, totalPages);
    plage.forEach(p => {
      if (p === '...') {
        boutons.push(`<span class="page-ellipsis" aria-hidden="true">&hellip;</span>`);
      } else {
        boutons.push(`
          <button class="page-btn ${p === this._page ? 'actif' : ''}"
                  data-page="${p}"
                  aria-label="Page ${p}"
                  ${p === this._page ? 'aria-current="page"' : ''}>
            ${p}
          </button>
        `);
      }
    });

    // Suivant
    boutons.push(`
      <button class="page-btn" data-page="${this._page + 1}"
              ${this._page >= totalPages ? 'disabled aria-disabled="true"' : ''}
              aria-label="Page suivante">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    `);

    conteneur.innerHTML = `
      <nav class="pagination" aria-label="Navigation entre les pages d'articles">
        ${boutons.join('')}
      </nav>
    `;

    // Événements de pagination
    conteneur.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async () => {
        this._page = parseInt(btn.dataset.page, 10);
        this._mettreAJourURL();
        await this._chargerArticles();
        // Scroll vers le haut de la liste
        document.getElementById('grille-articles')?.scrollIntoView({
          behavior: 'smooth', block: 'start'
        });
      });
    });
  }

  /**
   * Calcule la plage de pages à afficher
   * @param {number} page 
   * @param {number} total 
   * @returns {Array}
   */
  _calculerPlage(page, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const plage = [1];
    if (page > 3) plage.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
      plage.push(i);
    }
    if (page < total - 2) plage.push('...');
    plage.push(total);
    return plage;
  }

  // ============================================================
  // RENDU PAGE ARTICLE
  // ============================================================

  _rendrePageArticle(article) {
    // Titre
    const titre = document.getElementById('titre-article');
    if (titre) titre.textContent = article.titre;

    // Chapô
    const chapo = document.getElementById('chapo-article');
    if (chapo && article.extrait) chapo.textContent = article.extrait;

    // Image de couverture
    if (article.image_couverture) {
      const img = document.getElementById('couverture-article');
      if (img) {
        img.src    = article.image_couverture;
        img.alt    = `Illustration : ${article.titre}`;
        img.removeAttribute('hidden');
      }
    }

    // Contenu (sanitisé côté serveur — on fait confiance)
    const corps = document.getElementById('corps-article');
    if (corps) corps.innerHTML = article.contenu || '';

    // Métadonnées
    const elemDate  = document.getElementById('date-article');
    const elemAuteur = document.getElementById('auteur-article');
    const elemTemps  = document.getElementById('temps-article');

    if (elemDate) {
      elemDate.textContent = formaterDate(article.date_publication);
      elemDate.setAttribute('datetime', article.date_publication || '');
    }
    if (elemAuteur) elemAuteur.textContent = article.auteur_nom || 'Auteur';
    if (elemTemps && article.temps_lecture) {
      elemTemps.textContent = `${article.temps_lecture} min de lecture`;
    }

    // Tags
    const conteneurTags = document.getElementById('tags-article');
    if (conteneurTags && article.tags?.length) {
      conteneurTags.innerHTML = article.tags.map(tag => `
        <a href="/blog/index.html?tag=${encodeURIComponent(tag)}"
           class="tag-article"
           rel="tag">
          ${echapper(tag)}
        </a>
      `).join('');
    }

    // Titre de la page (DOM)
    document.title = `${article.titre} — Portfolio Éditorial`;
  }

  // ============================================================
  // ARTICLES CONNEXES
  // ============================================================

  async _chargerArticlesConnexes(articleCourant) {
    const conteneur = document.getElementById('articles-connexes');
    if (!conteneur) return;

    try {
      const { donnees } = await stockage.obtenirTous(COLLECTIONS.ARTICLES, {
        filtres: {
          statut:    'publié',
          categorie: articleCourant.categorie,
        },
        limite: 3,
        tri:    'date_publication',
        ordre:  'desc',
      });

      // Exclure l'article courant
      const connexes = (donnees || []).filter(a => a.id !== articleCourant.id).slice(0, 3);

      if (!connexes.length) {
        conteneur.closest('.section-connexes')?.setAttribute('hidden', '');
        return;
      }

      conteneur.innerHTML = connexes.map(art =>
        this._genererCarteArticle(art)
      ).join('');

    } catch (_) {
      conteneur.closest('.section-connexes')?.setAttribute('hidden', '');
    }
  }

  // ============================================================
  // PROGRESSION DE LECTURE
  // ============================================================

  _configurerProgressionLecture() {
    const barre = document.getElementById('barre-progression');
    if (!barre) return;

    const corps = document.getElementById('corps-article');
    if (!corps) return;

    const mettreAJour = () => {
      const rectCorps  = corps.getBoundingClientRect();
      const hauteurFenetre = window.innerHeight;
      const debut      = rectCorps.top + window.scrollY;
      const fin        = rectCorps.bottom + window.scrollY - hauteurFenetre;
      const progression = Math.min(
        1,
        Math.max(0, (window.scrollY - debut) / (fin - debut))
      );
      barre.style.transform = `scaleX(${progression})`;
    };

    window.addEventListener('scroll', mettreAJour, { passive: true });
    mettreAJour();
  }

  // ============================================================
  // TABLE DES MATIÈRES
  // ============================================================

  _configurerTableMatieres() {
    const corps = document.getElementById('corps-article');
    const toc   = document.getElementById('table-matieres');
    if (!corps || !toc) return;

    const titres = corps.querySelectorAll('h2, h3');
    if (titres.length < 3) {
      toc.closest('.widget-toc')?.setAttribute('hidden', '');
      return;
    }

    // Génère les ancres
    titres.forEach((titre, i) => {
      const id = titre.id || `section-${i + 1}`;
      titre.id = id;
    });

    // Rendu de la TDM
    toc.innerHTML = Array.from(titres).map(titre => `
      <li class="toc-element ${titre.tagName === 'H3' ? 'toc-h3' : ''}">
        <a href="#${titre.id}" class="toc-lien">
          ${echapper(titre.textContent)}
        </a>
      </li>
    `).join('');

    // Observateur de surbrillance
    const observer = new IntersectionObserver(
      (entrees) => {
        entrees.forEach(entree => {
          const lien = toc.querySelector(`a[href="#${entree.target.id}"]`);
          if (lien) lien.classList.toggle('actif', entree.isIntersecting);
        });
      },
      { rootMargin: '-20% 0px -75% 0px' }
    );

    titres.forEach(t => observer.observe(t));
  }

  // ============================================================
  // SEO DYNAMIQUE
  // ============================================================

  _configurerSEOListing() {
    const titre = this._categorie
      ? `Blog — ${this._categorie}`
      : 'Blog — Toutes les publications';

    const description = this._categorie
      ? `Articles et réflexions sur ${this._categorie}. Blog éditorial de Abdel-hamid M. LOUKI.`
      : 'Toutes mes publications : design, code et culture numérique. Blog éditorial indépendant.';

    seo.configurer({
      titre,
      description,
      type: 'website',
      fil: [
        { nom: 'Accueil', url: '/' },
        { nom: 'Blog', url: '/blog/index.html' },
        ...(this._categorie ? [{ nom: this._categorie }] : []),
      ],
    });
  }

  _configurerSEOArticle(article) {
    seo.configurer({
      titre:            article.titre,
      description:      article.meta_description || article.extrait,
      url:              `${window.location.origin}/blog/article.html?slug=${article.slug}`,
      image:            article.image_couverture,
      type:             'article',
      datePublication:  article.date_publication,
      dateModification: article.modifie_le,
      tags:             article.tags,
      auteur:           { nom: article.auteur_nom },
      categorie:        article.categorie,
      nombreMots:       article.nombre_mots,
      fil: [
        { nom: 'Accueil', url: '/' },
        { nom: 'Blog', url: '/blog/index.html' },
        ...(article.categorie ? [{ nom: article.categorie, url: `/blog/index.html?cat=${article.categorie}` }] : []),
        { nom: article.titre },
      ],
      article: true,
    });
  }

  // ============================================================
  // URL PROPRE
  // ============================================================

  _mettreAJourURL() {
    const params = new URLSearchParams();
    if (this._page > 1)  params.set('page', this._page);
    if (this._categorie) params.set('cat', this._categorie);
    if (this._tag)       params.set('tag', this._tag);
    if (this._recherche) params.set('q', this._recherche);

    const nouvelleURL = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;

    window.history.replaceState({}, '', nouvelleURL);
  }

  // ============================================================
  // VUES
  // ============================================================

  async _incrementerVues(id) {
    if (!id) return;
    try {
      const base = (window.CONFIG && window.CONFIG.API_BASE) || '';
      await fetch(`${base.replace(/\/+$/, '')}/api/vues?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id }),
      });
    } catch (_) {
      // Silencieux — pas critique
    }
  }

  // ============================================================
  // OBSERVATEURS
  // ============================================================

  _initialiserObservateurs() {
    // Barres de progression des compétences
    const barres = document.querySelectorAll('.barre-niveau-remplissage');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('anime');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.5 }
    );
    barres.forEach(b => obs.observe(b));
  }

  // ============================================================
  // GÉNÉRATEURS HTML
  // ============================================================

  _genererCarteArticle(article, index = 0) {
    const slug  = article.slug || Transformateurs.slugifier(article.titre);
    const dateF = formaterDate(article.date_publication);

    return `
      <article class="carte-vedette" data-animer data-delai="${Math.min(index * 80, 400)}"
               itemscope itemtype="https://schema.org/Article">
        ${article.image_couverture ? `
        <div class="carte-vedette-image">
          <img src="${echapper(article.image_couverture)}"
               alt="${echapper(article.titre)}"
               loading="lazy"
               decoding="async"
               width="600" height="338"
               itemprop="image">
        </div>` : ''}
        <div class="carte-vedette-corps">
          ${article.categorie ? `
          <a href="/blog/index.html?cat=${encodeURIComponent(article.categorie)}"
             class="carte-vedette-rubrique"
             itemprop="articleSection">
            ${echapper(article.categorie)}
          </a>` : ''}
          <a href="/blog/article.html?slug=${encodeURIComponent(slug)}" class="carte-vedette-titre" itemprop="headline url">
            ${echapper(article.titre)}
          </a>
          ${article.extrait ? `
          <p class="carte-vedette-extrait" itemprop="description">
            ${echapper(article.extrait)}
          </p>` : ''}
          <div class="carte-vedette-meta">
            <span itemprop="author">${echapper(article.auteur_nom || 'Auteur')}</span>
            <span aria-hidden="true">&mdash;</span>
            <time datetime="${article.date_publication || ''}" itemprop="datePublished">
              ${dateF}
            </time>
            ${article.temps_lecture ? `
            <span aria-hidden="true">&bull;</span>
            <span>${article.temps_lecture} min</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  _genererMessageVide() {
    const msg = this._recherche
      ? `Aucun résultat pour « ${echapper(this._recherche)} ».`
      : this._categorie
        ? `Aucun article dans la catégorie « ${echapper(this._categorie)} ».`
        : 'Aucun article disponible pour le moment.';

    return `
      <div class="message-vide" role="status" aria-live="polite" style="
        grid-column: 1 / -1; padding: var(--espace-16); text-align: center;">
        <p style="font-family:var(--police-mono);font-size:var(--taille-sm);
                  color:var(--texte-tertiaire);letter-spacing:var(--espacement-large);">
          ${msg}
        </p>
      </div>
    `;
  }

  _genererErreur() {
    return `
      <div role="alert" style="
        grid-column: 1 / -1; padding: var(--espace-12); text-align: center;">
        <p style="font-family:var(--police-mono);color:var(--couleur-erreur);">
          Impossible de charger les articles. Veuillez réessayer.
        </p>
      </div>
    `;
  }

  _afficherChargement(conteneur) {
    conteneur.innerHTML = Array.from({ length: 3 }, () => `
      <article class="carte-vedette squelette-carte" aria-busy="true" aria-label="Chargement...">
        <div class="squelette-image"></div>
        <div class="carte-vedette-corps">
          <div class="squelette-texte squelette-court"></div>
          <div class="squelette-texte squelette-long"></div>
          <div class="squelette-texte squelette-moyen"></div>
        </div>
      </article>
    `).join('');
  }

  _afficherErreur404() {
    document.title = 'Article non trouvé — Portfolio Éditorial';
    const principal = document.getElementById('contenu-principal');
    if (principal) {
      principal.innerHTML = `
        <div style="text-align:center;padding:var(--espace-32) var(--espace-6);">
          <div style="font-family:var(--police-display);font-size:var(--taille-7xl);
                      font-weight:900;color:var(--couleur-accent-tache);line-height:1;">
            404
          </div>
          <h1 style="font-family:var(--police-display);font-size:var(--taille-3xl);
                     margin:var(--espace-6) 0 var(--espace-4);">
            Article introuvable
          </h1>
          <p style="color:var(--texte-secondaire);margin-bottom:var(--espace-8);">
            Cet article n'existe pas ou a été supprimé.
          </p>
          <a href="/blog/index.html" class="btn btn-primaire">
            Retourner au blog
          </a>
        </div>
      `;
    }
  }

  _mettreAJourCompteurResultats(total) {
    const elem = document.getElementById('compteur-resultats');
    if (!elem) return;
    elem.textContent = total === 0
      ? 'Aucun résultat'
      : `${total} article${total > 1 ? 's' : ''}`;
  }
}

// Singleton exporté
const blog = new MoteurBlog();
export default blog;
