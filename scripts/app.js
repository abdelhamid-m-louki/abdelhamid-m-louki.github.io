/**
 * APPLICATION PRINCIPALE
 * Portfolio Éditorial — Orchestrateur de modules
 *
 * Point d'entrée unique de toutes les interactions JavaScript.
 * Initialise, coordonne et connecte tous les modules.
 *
 * Architecture :
 * - Import ESM modulaire
 * - Initialisation progressive
 * - Événements délégués
 * - Intersection Observer pour les animations
 * - Accessibilité clavier
 */

'use strict';

// --- Imports des modules ---
import stockage, { COLLECTIONS } from './storage/storage-manager.js';
import seo      from './seo/seo.js';

// ============================================================
// INITIALISATION PRINCIPALE
// ============================================================

/**
 * Point d'entrée — exécuté au chargement du DOM
 */
async function initialiserApplication() {
  // 1. Navigation et UI de base (synchrone, immédiat)
  initialiserNavigation();
  initialiserMenuMobile();
  initialiserBoutonHautDePage();
  initialiserDateBandeau();
  mettreAJourAnnee();

  // 2. Animations et observations (non-bloquant)
  initialiserObservateurEntree();
  initialiserCompteurs();

  // 3. Chargement des données (asynchrone)
  await chargerDonnees();

  // 4. Accessibilité
  initialiserAccessibilite();
}

// ============================================================
// NAVIGATION
// ============================================================

function initialiserNavigation() {
  const enTete = document.getElementById('en-tete-principal');
  if (!enTete) return;

  // Marquer l'en-tête comme défilant après 80px
  const observerScroll = () => {
    const defilant = window.scrollY > 80;
    enTete.classList.toggle('en-tete-defilant', defilant);
  };

  window.addEventListener('scroll', observerScroll, { passive: true });
  observerScroll(); // État initial

  // Marquer le lien actif
  const cheminActuel = window.location.pathname;
  document.querySelectorAll('.nav-lien').forEach(lien => {
    const href = lien.getAttribute('href');
    if (!href) return;
    const estActif = href === cheminActuel ||
      (href !== '/' && cheminActuel.startsWith(href));
    lien.classList.toggle('actif', estActif);
    if (estActif) lien.setAttribute('aria-current', 'page');
    else lien.removeAttribute('aria-current');
  });
}

// ============================================================
// MENU MOBILE
// ============================================================

function initialiserMenuMobile() {
  const btnOuvrir  = document.getElementById('btn-hamburger');
  const btnFermer  = document.getElementById('btn-fermer-menu');
  const menu       = document.getElementById('menu-mobile');
  const overlay    = document.getElementById('menu-overlay');

  if (!btnOuvrir || !menu) return;

  const ouvrirMenu = () => {
    menu.removeAttribute('hidden');
    menu.classList.add('ouvert');
    overlay?.classList.add('actif');
    btnOuvrir.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus sur le premier lien
    setTimeout(() => {
      menu.querySelector('.menu-mobile-lien')?.focus();
    }, 100);
  };

  const fermerMenu = () => {
    menu.classList.remove('ouvert');
    overlay?.classList.remove('actif');
    btnOuvrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Retour du focus
    btnOuvrir.focus();
    // Cache après la transition
    setTimeout(() => menu.setAttribute('hidden', ''), 400);
  };

  btnOuvrir.addEventListener('click', ouvrirMenu);
  btnFermer?.addEventListener('click', fermerMenu);
  overlay?.addEventListener('click', fermerMenu);

  // Fermeture avec Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('ouvert')) {
      fermerMenu();
    }
  });

  // Fermeture sur les liens du menu
  menu.querySelectorAll('.menu-mobile-lien').forEach(lien => {
    lien.addEventListener('click', fermerMenu);
  });
}

// ============================================================
// BOUTON RETOUR EN HAUT
// ============================================================

function initialiserBoutonHautDePage() {
  const btn = document.getElementById('btn-haut-page');
  if (!btn) return;

  const onScroll = () => {
    const afficher = window.scrollY > 400;
    if (afficher) btn.removeAttribute('hidden');
    else btn.setAttribute('hidden', '');
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus sur l'en-tête pour l'accessibilité
    document.querySelector('#en-tete-principal')?.focus();
  });
}

// ============================================================
// DATE DU BANDEAU
// ============================================================

function initialiserDateBandeau() {
  const elemDate = document.getElementById('date-bandeau');
  if (!elemDate) return;

  const maintenant = new Date();
  const options = {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  };
  const dateFormatee = maintenant.toLocaleDateString('fr-FR', options);
  // Capitalise la première lettre
  elemDate.textContent = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
  elemDate.setAttribute('datetime', maintenant.toISOString().split('T')[0]);
}

// ============================================================
// ANNÉE COPYRIGHT
// ============================================================

function mettreAJourAnnee() {
  const elem = document.getElementById('annee-copyright');
  if (elem) elem.textContent = new Date().getFullYear();
}

// ============================================================
// OBSERVATEUR D'ENTRÉE — ANIMATIONS AU DÉFILEMENT
// ============================================================

function initialiserObservateurEntree() {
  const elements = document.querySelectorAll('[data-animer]');
  if (!elements.length) return;

  // Respect de la préférence de réduction de mouvement
  const reduireMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduireMotion) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach(entree => {
        if (entree.isIntersecting) {
          const delai = entree.target.dataset.delai || 0;
          setTimeout(() => {
            entree.target.classList.add('visible');
          }, parseInt(delai));
          observateur.unobserve(entree.target);
        }
      });
    },
    {
      threshold:  0.12,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  elements.forEach(el => observateur.observe(el));
}

// ============================================================
// COMPTEURS ANIMÉS
// ============================================================

function initialiserCompteurs() {
  const compteurs = document.querySelectorAll('[data-compteur]');
  if (!compteurs.length) return;

  const reduireMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animerCompteur = (element) => {
    const cible   = parseInt(element.dataset.compteur, 10);
    const duree   = reduireMotion ? 0 : 1500;
    const debut   = performance.now();
    const depart  = 0;

    if (duree === 0) {
      element.textContent = cible;
      return;
    }

    const animer = (maintenant) => {
      const ecoulé = maintenant - debut;
      const progression = Math.min(ecoulé / duree, 1);
      // Easing ease-out cubique
      const ease = 1 - Math.pow(1 - progression, 3);
      const valeur = Math.round(depart + (cible - depart) * ease);
      element.textContent = valeur;
      if (progression < 1) requestAnimationFrame(animer);
      else element.textContent = cible;
    };

    requestAnimationFrame(animer);
  };

  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach(entree => {
        if (entree.isIntersecting) {
          animerCompteur(entree.target);
          observateur.unobserve(entree.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  compteurs.forEach(el => observateur.observe(el));
}

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================

async function chargerDonnees() {
  // Chargement en parallèle pour optimiser le TTFB
  const promesses = [];

  if (document.getElementById('grille-projets')) {
    promesses.push(chargerProjetsVedettes());
  }
  if (document.getElementById('grille-blog')) {
    promesses.push(chargerDerniersArticles());
  }
  if (document.getElementById('liste-competences')) {
    promesses.push(chargerCompetences());
  }
  if (document.getElementById('frise-experience')) {
    promesses.push(chargerExperiences());
  }

  // On ne bloque pas sur les erreurs de données
  await Promise.allSettled(promesses);

  // Métriques réelles (accueil) — remplace tout chiffre fantaisiste
  await renseignerMetriquesReelles();
}

/**
 * Renseigne les métriques de l'accueil (projets / articles publiés)
 * depuis la base, au lieu de valeurs fantaisistes en dur.
 */
async function renseignerMetriquesReelles() {
  const elProjets  = document.querySelector('[data-mesure="projets"]');
  const elArticles = document.querySelector('[data-mesure="articles"]');
  if (!elProjets && !elArticles) return;

  try {
    const [nbProjets, nbArticles] = await Promise.all([
      elProjets
        ? stockage.compter(COLLECTIONS.PROJETS, { statut: 'publié' })
        : Promise.resolve(0),
      elArticles
        ? stockage.compter(COLLECTIONS.ARTICLES, { statut: 'publié' })
        : Promise.resolve(0),
    ]);

    if (elProjets) {
      elProjets.textContent = String(nbProjets);
      elProjets.setAttribute('data-compteur', String(nbProjets));
      elProjets.setAttribute('aria-label', `${nbProjets} projet${nbProjets > 1 ? 's' : ''} réalisé${nbProjets > 1 ? 's' : ''}`);
    }
    if (elArticles) {
      elArticles.textContent = String(nbArticles);
      elArticles.setAttribute('data-compteur', String(nbArticles));
      elArticles.setAttribute('aria-label', `${nbArticles} article${nbArticles > 1 ? 's' : ''} publié${nbArticles > 1 ? 's' : ''}`);
    }

    // Anime les compteurs désormais réels
    if (elProjets || elArticles) initialiserCompteurs();
  } catch (erreur) {
    console.warn('[App] Métriques réelles indisponibles :', erreur.message);
  }
}

// ============================================================
// PROJETS VEDETTES
// ============================================================

async function chargerProjetsVedettes() {
  const conteneur = document.getElementById('grille-projets');
  if (!conteneur) return;

  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.PROJETS, {
      filtres: { statut: 'publié', vedette: true },
      limite:  3,
      tri:     'ordre',
      ordre:   'asc',
    });

    if (!donnees?.length) {
      conteneur.innerHTML = genererMessageVide('Aucun projet disponible pour le moment.');
      return;
    }

    conteneur.innerHTML = donnees.map((projet, index) =>
      genererCarteProjet(projet, index + 1)
    ).join('');

    // Réinitialise les animations pour les nouveaux éléments
    initialiserObservateurEntree();

  } catch (erreur) {
    console.error('[App] Erreur chargement projets :', erreur.message);
    conteneur.innerHTML = genererMessageVide('Impossible de charger les projets.');
  }
}

// ============================================================
// DERNIERS ARTICLES
// ============================================================

async function chargerDerniersArticles() {
  const conteneur = document.getElementById('grille-blog');
  if (!conteneur) return;

  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.ARTICLES, {
      filtres: { statut: 'publié' },
      limite:  4,
      tri:     'date_publication',
      ordre:   'desc',
    });

    if (!donnees?.length) {
      conteneur.innerHTML = genererMessageVide('Aucun article disponible.');
      return;
    }

    const [vedette, ...secondaires] = donnees;

    conteneur.innerHTML = `
      ${genererCarteVedette(vedette)}
      <div class="articles-secondaires" role="list">
        ${secondaires.map(article => genererBrève(article)).join('')}
      </div>
    `;

  } catch (erreur) {
    console.error('[App] Erreur chargement articles :', erreur.message);
  }
}

// ============================================================
// COMPÉTENCES
// ============================================================

async function chargerCompetences() {
  const conteneur = document.getElementById('liste-competences');
  if (!conteneur) return;

  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.COMPETENCES, {
      filtres: { vedette: true },
      limite:  6,
      tri:     'ordre',
    });

    if (!donnees?.length) return;

    conteneur.innerHTML = donnees.map(comp => `
      <div class="carte-competence" role="listitem" data-animer data-delai="100">
        <div class="carte-competence-nom">${echapper(comp.nom)}</div>
        <div class="barre-niveau" role="progressbar"
             aria-valuenow="${comp.niveau || 80}"
             aria-valuemin="0"
             aria-valuemax="100"
             aria-label="${echapper(comp.nom)} : ${comp.niveau || 80}%">
          <div class="barre-niveau-remplissage"
               style="--niveau: ${(comp.niveau || 80) / 100}"></div>
        </div>
        <div class="carte-competence-pourcentage">${comp.niveau || 80}% maîtrise</div>
      </div>
    `).join('');

    // Déclenche l'animation des barres avec IntersectionObserver
    const barres = conteneur.querySelectorAll('.barre-niveau-remplissage');
    const obs = new IntersectionObserver(entrees => {
      entrees.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('anime');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    barres.forEach(b => obs.observe(b));

  } catch (erreur) {
    console.error('[App] Erreur chargement compétences :', erreur.message);
  }
}

// ============================================================
// EXPÉRIENCES
// ============================================================

async function chargerExperiences() {
  const friseExp  = document.getElementById('frise-experience');
  const friseForm = document.getElementById('frise-formation');
  if (!friseExp) return;

  try {
    const [{ donnees: experiences }, { donnees: formations }] = await Promise.all([
      stockage.obtenirTous(COLLECTIONS.EXPERIENCES, {
        filtres: { type: 'emploi' },
        tri: 'date_debut',
        ordre: 'desc',
        limite: 4,
      }),
      stockage.obtenirTous(COLLECTIONS.FORMATIONS, {
        tri: 'date_debut',
        ordre: 'desc',
        limite: 3,
      }),
    ]);

    if (friseExp && experiences?.length) {
      friseExp.innerHTML = experiences.map(exp =>
        genererElementFrise(exp)
      ).join('');
    }

    if (friseForm && formations?.length) {
      friseForm.innerHTML = formations.map(form =>
        genererElementFrise(form)
      ).join('');
    }

  } catch (erreur) {
    console.error('[App] Erreur chargement expériences :', erreur.message);
  }
}

// ============================================================
// GÉNÉRATEURS DE HTML
// ============================================================

function genererCarteProjet(projet, index) {
  const slug = projet.slug || Transformateurs.slugifier(projet.titre);
  return `
    <article class="carte-projet" role="listitem" data-animer data-delai="${index * 100}">
      <div class="carte-projet-lien-complet">
        <div class="carte-projet-image">
          ${projet.image
            ? `<img src="${echapper(projet.image)}"
                    alt="${echapper(projet.titre)}"
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="375">`
            : `<div class="image-placeholder" aria-hidden="true">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                   <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
                   <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                 </svg>
               </div>`
          }
          <div class="carte-projet-numero" aria-hidden="true">0${index}</div>
        </div>
        <div class="carte-projet-corps">
          <div class="carte-projet-categorie">${echapper(projet.categorie || 'Projet')}</div>
          <h3 class="carte-projet-titre">${echapper(projet.titre)}</h3>
          <p class="carte-projet-description">${echapper(projet.description_courte || '')}</p>
          <div class="carte-projet-pied">
            <div class="technos" aria-label="Technologies utilisées">
              ${(projet.technologies || []).slice(0, 4).map(t =>
                `<span class="techno-tag">${echapper(t)}</span>`
              ).join('')}
            </div>
            <span class="lien-voir-tout" aria-hidden="true">
              Voir le projet
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function genererCarteVedette(article) {
  const slug = article.slug || Transformateurs.slugifier(article.titre);
  const dateF = formaterDate(article.date_publication);
  return `
    <article class="carte-vedette" role="listitem" itemscope itemtype="https://schema.org/Article">
      <a href="/blog/article.html?slug=${encodeURIComponent(slug)}" class="carte-vedette-lien">
        ${article.image_couverture
          ? `<div class="carte-vedette-image">
               <img src="${echapper(article.image_couverture)}"
                    alt="${echapper(article.titre)}"
                    loading="lazy"
                    decoding="async"
                    width="800" height="450"
                    itemprop="image">
             </div>`
          : ''
        }
        <div class="carte-vedette-corps">
          ${article.categorie
            ? `<span class="carte-vedette-rubrique" itemprop="articleSection">${echapper(article.categorie)}</span>`
            : ''
          }
          <h3 class="carte-vedette-titre" itemprop="headline">${echapper(article.titre)}</h3>
          <p class="carte-vedette-extrait" itemprop="description">${echapper(article.extrait || '')}</p>
          <div class="carte-vedette-meta">
            <span itemprop="author">${echapper(article.auteur_nom || 'Auteur')}</span>
            <span aria-hidden="true">&mdash;</span>
            <time datetime="${article.date_publication || ''}" itemprop="datePublished">${dateF}</time>
            ${article.temps_lecture
              ? `<span aria-hidden="true">&bull;</span><span>${article.temps_lecture} min de lecture</span>`
              : ''
            }
          </div>
        </div>
      </a>
    </article>
  `;
}

function genererBrève(article) {
  const slug = article.slug || Transformateurs.slugifier(article.titre);
  const dateF = formaterDate(article.date_publication);
  return `
    <article class="breve" role="listitem" itemscope itemtype="https://schema.org/Article">
      <a href="/blog/article.html?slug=${encodeURIComponent(slug)}" class="breve-titre" itemprop="headline url">
        ${echapper(article.titre)}
      </a>
      <div class="breve-date">
        <time datetime="${article.date_publication || ''}" itemprop="datePublished">${dateF}</time>
        ${article.categorie
          ? ` &mdash; <span itemprop="articleSection">${echapper(article.categorie)}</span>`
          : ''
        }
      </div>
    </article>
  `;
}

function genererElementFrise(element) {
  const dateDebut = formaterDateCourte(element.date_debut);
  const dateFin   = element.date_fin ? formaterDateCourte(element.date_fin) : 'Présent';
  return `
    <div class="element-frise" role="listitem" data-animer>
      <div class="frise-point" aria-hidden="true"></div>
      <div class="frise-date">${dateDebut} &ndash; ${dateFin}</div>
      <div class="frise-poste">${echapper(element.titre || element.poste || '')}</div>
      ${element.organisation || element.entreprise
        ? `<div class="frise-entreprise">${echapper(element.organisation || element.entreprise)}</div>`
        : ''
      }
      ${element.description
        ? `<p class="frise-description">${echapper(element.description)}</p>`
        : ''
      }
    </div>
  `;
}

function genererMessageVide(message) {
  return `
    <div class="message-vide" role="status" aria-live="polite" style="
      grid-column: 1 / -1;
      padding: var(--espace-12);
      text-align: center;
      font-family: var(--police-mono);
      font-size: var(--taille-sm);
      color: var(--texte-tertiaire);
      letter-spacing: var(--espacement-large);
    ">
      ${echapper(message)}
    </div>
  `;
}

// ============================================================
// ACCESSIBILITÉ
// ============================================================

function initialiserAccessibilite() {
  // Lien "Aller au contenu" pour la navigation clavier
  creerLienSkip();

  // Gestion du focus visible lors de la navigation clavier
  let navigueAuClavier = false;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      navigueAuClavier = true;
      document.body.classList.add('navigation-clavier');
    }
  });
  document.addEventListener('mousedown', () => {
    navigueAuClavier = false;
    document.body.classList.remove('navigation-clavier');
  });

  // Annonces pour les lecteurs d'écran lors des chargements
  creerRegionAria();
}

function creerLienSkip() {
  if (document.getElementById('lien-skip')) return;
  const lien = document.createElement('a');
  lien.id          = 'lien-skip';
  lien.href        = '#contenu-principal';
  lien.className   = 'lien-skip';
  lien.textContent = 'Aller au contenu principal';
  document.body.insertBefore(lien, document.body.firstChild);

  // Styles injectés directement (critique, toujours visible au focus)
  const style = document.createElement('style');
  style.textContent = `
    .lien-skip {
      position: absolute;
      top: -100px;
      left: var(--espace-4);
      z-index: 9999;
      background: var(--couleur-encre);
      color: var(--couleur-fond);
      padding: var(--espace-3) var(--espace-5);
      font-family: var(--police-condensee);
      font-size: var(--taille-sm);
      font-weight: 700;
      letter-spacing: var(--espacement-large);
      text-transform: uppercase;
      text-decoration: none;
      transition: top var(--transition-rapide);
      border-bottom: 2px solid var(--couleur-accent);
    }
    .lien-skip:focus {
      top: var(--espace-2);
      outline: 3px solid var(--couleur-accent);
      outline-offset: 3px;
    }
  `;
  document.head.appendChild(style);
}

function creerRegionAria() {
  if (document.getElementById('region-aria')) return;
  const region = document.createElement('div');
  region.id              = 'region-aria';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className       = 'sr-seulement';
  document.body.appendChild(region);
}

// ============================================================
// UTILITAIRES
// ============================================================

/** Utilitaires de transformation (miroir de interfaces.js) */
const Transformateurs = {
  slugifier(texte) {
    return String(texte)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },
};

/**
 * Échappe les caractères HTML pour éviter les XSS
 * @param {string} texte
 * @returns {string}
 */
function echapper(texte) {
  if (!texte) return '';
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formate une date en français (long)
 * @param {string} dateIso
 * @returns {string}
 */
function formaterDate(dateIso) {
  if (!dateIso) return '';
  try {
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) { return dateIso; }
}

/**
 * Formate une date en français (court — mois/année)
 * @param {string} dateIso
 * @returns {string}
 */
function formaterDateCourte(dateIso) {
  if (!dateIso) return '';
  try {
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short'
    });
  } catch (_) { return dateIso; }
}

// ============================================================
// DÉMARRAGE
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiserApplication);
} else {
  initialiserApplication();
}

// Export pour les modules dépendants
export { echapper, formaterDate, formaterDateCourte, Transformateurs };
