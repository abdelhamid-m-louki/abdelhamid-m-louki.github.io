/**
 * TABLEAU DE BORD ADMINISTRATEUR
 * Portfolio Éditorial — Initialisation et chargement des données
 *
 * Fonctionnalités :
 * - Protection de route (admin uniquement)
 * - Statistiques générales
 * - Articles récents
 * - Activité récente
 * - Informations système
 * - Actions rapides
 * - Gestion des toasts
 */

'use strict';

import auth, { ROLES }      from '../auth/auth.js';
import stockage, { COLLECTIONS } from '../storage/storage-manager.js';
import { echapper, formaterDate } from '../app.js';

// ============================================================
// INITIALISATION
// ============================================================

async function initialiserTableauDeBord() {
  // 1. Protection de route — redirige si non connecté
  const autorise = await auth.protegerRoute(ROLES.EDITEUR);
  if (!autorise) return;

  // 2. Interface utilisateur
  afficherInfosUtilisateur();
  initialiserDeconnexion();
  afficherDateTopbar();

  // 3. Chargement des données en parallèle
  await Promise.allSettled([
    chargerStatistiques(),
    chargerArticlesRecents(),
    chargerActiviteRecente(),
    chargerInfoSysteme(),
    chargerProjetsRecents(),
  ]);
}

// ============================================================
// INFORMATIONS UTILISATEUR
// ============================================================

function afficherInfosUtilisateur() {
  const utilisateur = auth.utilisateur;
  if (!utilisateur) return;

  const elemNom  = document.getElementById('nom-utilisateur');
  const elemRole = document.getElementById('role-utilisateur');
  const elemAvatar = document.querySelector('.sidebar-utilisateur-avatar');

  if (elemNom)  elemNom.textContent  = utilisateur.nom || utilisateur.email;
  if (elemRole) elemRole.textContent = labelRole(utilisateur.role);

  if (elemAvatar && utilisateur.nom) {
    elemAvatar.textContent = utilisateur.nom.charAt(0).toUpperCase();
  }
}

function labelRole(role) {
  const labels = {
    admin:   'Administrateur',
    editeur: 'Éditeur',
    lecteur: 'Lecteur',
  };
  return labels[role] || role || 'Utilisateur';
}

// ============================================================
// DÉCONNEXION
// ============================================================

function initialiserDeconnexion() {
  const btn = document.getElementById('btn-deconnexion');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await auth.seDeconnecter();
    } catch (erreur) {
      afficherToast('Erreur lors de la déconnexion.', 'erreur');
      btn.disabled = false;
    }
  });
}

// ============================================================
// DATE TOPBAR
// ============================================================

function afficherDateTopbar() {
  const elem = document.getElementById('topbar-date');
  if (!elem) return;

  const maintenant = new Date();
  elem.textContent = maintenant.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

// ============================================================
// STATISTIQUES
// ============================================================

async function chargerStatistiques() {
  const conteneur = document.getElementById('grille-stats');
  if (!conteneur) return;

  try {
    // Comptages en parallèle
    const [
      nbArticles,
      nbArticlesPublies,
      nbProjets,
      nbBrouillons,
    ] = await Promise.all([
      stockage.compter(COLLECTIONS.ARTICLES),
      stockage.compter(COLLECTIONS.ARTICLES, { statut: 'publié' }),
      stockage.compter(COLLECTIONS.PROJETS),
      stockage.compter(COLLECTIONS.ARTICLES, { statut: 'brouillon' }),
    ]);

    const stats = [
      {
        label:        'Articles publiés',
        valeur:       nbArticlesPublies,
        delta:        `${nbArticles} au total`,
        accentCouleur: 'var(--couleur-accent)',
        accentPale:   'var(--couleur-accent-pale)',
        icone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/><path d="M15 18h-5"/>
                </svg>`,
      },
      {
        label:        'Projets',
        valeur:       nbProjets,
        delta:        'en portfolio',
        accentCouleur: 'var(--couleur-bleu-encre)',
        accentPale:   'rgba(26, 39, 68, 0.12)',
        icone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect width="20" height="14" x="2" y="3" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>`,
      },
      {
        label:        'Brouillons',
        valeur:       nbBrouillons,
        delta:        'en attente de publication',
        accentCouleur: 'var(--couleur-sepia)',
        accentPale:   'rgba(139, 115, 85, 0.10)',
        icone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>`,
      },
      {
        label:        'Total articles',
        valeur:       nbArticles,
        delta:        `dont ${nbArticlesPublies} publiés`,
        accentCouleur: 'var(--couleur-rouge)',
        accentPale:   'rgba(139, 26, 26, 0.08)',
        icone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M3 3h18v18H3z"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h4"/>
                </svg>`,
      },
    ];

    conteneur.innerHTML = stats.map(stat => genererWidgetStat(stat)).join('');

    // Animation des compteurs
    conteneur.querySelectorAll('[data-compteur]').forEach(elem => {
      animerCompteur(elem);
    });

  } catch (erreur) {
    console.error('[Dashboard] Erreur stats :', erreur.message);
    conteneur.innerHTML = `
      <div style="grid-column:1/-1;padding:var(--espace-6);color:var(--couleur-erreur);
                  font-family:var(--police-mono);font-size:var(--taille-xs);">
        Impossible de charger les statistiques.
      </div>
    `;
  }
}

function genererWidgetStat(stat) {
  return `
    <div class="widget-stat" role="listitem"
         style="--accent-couleur:${stat.accentCouleur};--accent-couleur-pale:${stat.accentPale};">
      <div class="widget-stat-entete">
        <div class="widget-stat-label">${echapper(stat.label)}</div>
        <div class="widget-stat-icone" aria-hidden="true">${stat.icone}</div>
      </div>
      <div class="widget-stat-valeur" data-compteur="${stat.valeur}"
           aria-label="${stat.valeur} ${echapper(stat.label)}">
        ${stat.valeur}
      </div>
      <div class="widget-stat-delta">${echapper(stat.delta)}</div>
    </div>
  `;
}

// ============================================================
// ARTICLES RÉCENTS
// ============================================================

async function chargerArticlesRecents() {
  const conteneur = document.getElementById('tableau-articles-recents');
  if (!conteneur) return;

  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.ARTICLES, {
      tri:    'modifie_le',
      ordre:  'desc',
      limite: 8,
    });

    if (!donnees?.length) {
      conteneur.innerHTML = genererVide('Aucun article créé.');
      return;
    }

    conteneur.innerHTML = `
      <table class="tableau-articles" aria-label="Articles récents">
        <thead>
          <tr>
            <th scope="col">Titre</th>
            <th scope="col">Statut</th>
            <th scope="col">Date</th>
            <th scope="col" aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(article => genererLigneArticle(article)).join('')}
        </tbody>
      </table>
    `;

  } catch (erreur) {
    conteneur.innerHTML = genererErreur('Impossible de charger les articles.');
  }
}

function genererLigneArticle(article) {
  const dateF = formaterDate(article.modifie_le || article.cree_le);
  const slug  = article.slug || '';

  const badgeClasse = {
    'publié':   'badge-statut-publie',
    'brouillon': 'badge-statut-brouillon',
    'archivé':  'badge-statut-archive',
  }[article.statut] || 'badge-statut-brouillon';

  return `
    <tr>
      <td>
        <a href="/admin/articles.html?id=${echapper(article.id)}"
           class="titre-article-admin"
           title="${echapper(article.titre)}">
          ${echapper(article.titre || 'Sans titre')}
        </a>
      </td>
      <td>
        <span class="badge-statut ${badgeClasse}">
          ${echapper(article.statut || 'brouillon')}
        </span>
      </td>
      <td>
        <time datetime="${article.modifie_le || ''}" style="font-family:var(--police-mono);font-size:var(--taille-xs);color:var(--texte-tertiaire);">
          ${dateF}
        </time>
      </td>
      <td>
        <div class="actions-ligne">
          <a href="/admin/articles.html?id=${echapper(article.id)}"
             class="btn-action-ligne"
             aria-label="Modifier ${echapper(article.titre)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </a>
          ${slug ? `
          <a href="/blog/${echapper(slug)}.html"
             class="btn-action-ligne"
             target="_blank" rel="noopener"
             aria-label="Voir l'article publié">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>` : ''}
          <button class="btn-action-ligne danger"
                  data-supprimer-id="${echapper(article.id)}"
                  data-supprimer-collection="${COLLECTIONS.ARTICLES}"
                  aria-label="Supprimer ${echapper(article.titre)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// ============================================================
// ACTIVITÉ RÉCENTE
// ============================================================

async function chargerActiviteRecente() {
  const conteneur = document.getElementById('liste-activite');
  if (!conteneur) return;

  try {
    const { donnees: articles } = await stockage.obtenirTous(COLLECTIONS.ARTICLES, {
      tri:    'cree_le',
      ordre:  'desc',
      limite: 5,
    });

    if (!articles?.length) {
      conteneur.innerHTML = genererVide('Aucune activité récente.');
      return;
    }

    conteneur.innerHTML = articles.map(article => `
      <div class="element-activite">
        <div class="activite-icone" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          </svg>
        </div>
        <div class="activite-contenu">
          <div class="activite-texte">
            Article <strong>${echapper(article.statut === 'publié' ? 'publié' : 'créé')}</strong> :
            <a href="/admin/articles.html?id=${echapper(article.id)}"
               class="activite-lien">
              ${echapper(article.titre || 'Sans titre')}
            </a>
          </div>
          <time class="activite-date" datetime="${article.cree_le || ''}">
            ${formaterDate(article.cree_le)}
          </time>
        </div>
      </div>
    `).join('');

  } catch (_) {
    conteneur.innerHTML = genererErreur('Activité non disponible.');
  }
}

// ============================================================
// INFORMATION SYSTÈME
// ============================================================

async function chargerInfoSysteme() {
  const conteneur = document.getElementById('info-systeme');
  if (!conteneur) return;

  await stockage._demarrer?.();

  const modeStockage = stockage.mode || 'inconnu';
  const estSupabase  = stockage.estSupabase;

  conteneur.innerHTML = `
    <div class="info-ligne">
      <span class="info-cle">Mode stockage</span>
      <span class="info-valeur">
        <span class="indicateur-mode ${estSupabase ? 'actif' : 'inactif'}" aria-hidden="true"></span>
        ${estSupabase ? 'Supabase PostgreSQL' : 'JSON Local'}
      </span>
    </div>
    <div class="info-ligne">
      <span class="info-cle">Environnement</span>
      <span class="info-valeur">
        ${window.location.hostname === 'localhost' ? 'Développement' : 'Production'}
      </span>
    </div>
    <div class="info-ligne">
      <span class="info-cle">Version</span>
      <span class="info-valeur">1.0.0</span>
    </div>
    <div class="info-ligne">
      <span class="info-cle">Dernière mise à jour</span>
      <span class="info-valeur" style="font-size:var(--taille-xs);">
        ${new Date().toLocaleDateString('fr-FR')}
      </span>
    </div>
  `;
}

// ============================================================
// PROJETS RÉCENTS
// ============================================================

async function chargerProjetsRecents() {
  const conteneur = document.getElementById('liste-projets-admin');
  if (!conteneur) return;

  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.PROJETS, {
      tri:    'modifie_le',
      ordre:  'desc',
      limite: 4,
    });

    if (!donnees?.length) {
      conteneur.innerHTML = genererVide('Aucun projet créé.');
      return;
    }

    conteneur.innerHTML = donnees.map(projet => `
      <div class="projet-item-admin">
        <a href="/admin/projets.html?id=${echapper(projet.id)}"
           class="projet-item-titre">
          ${echapper(projet.titre || 'Sans titre')}
        </a>
        <div class="projet-item-meta">
          <span style="font-family:var(--police-mono);font-size:var(--taille-xs);color:var(--texte-tertiaire);">
            ${echapper(projet.categorie || '')}
          </span>
          <span class="badge-statut ${projet.statut === 'publié' ? 'badge-statut-publie' : 'badge-statut-brouillon'}"
                style="font-size:10px;">
            ${echapper(projet.statut || 'brouillon')}
          </span>
        </div>
      </div>
    `).join('');

  } catch (_) {
    conteneur.innerHTML = genererErreur('Projets non disponibles.');
  }
}

// ============================================================
// SUPPRESSION AVEC CONFIRMATION
// ============================================================

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-supprimer-id]');
  if (!btn) return;

  const id         = btn.dataset.supprimerId;
  const collection = btn.dataset.supprimerCollection;

  if (!confirm('Confirmer la suppression ? Cette action est irréversible.')) return;

  try {
    btn.disabled = true;
    await stockage.supprimer(collection, id);
    // Supprime la ligne du tableau
    btn.closest('tr')?.remove();
    afficherToast('Élément supprimé avec succès.', 'succes');
  } catch (erreur) {
    afficherToast(`Erreur : ${erreur.message}`, 'erreur');
    btn.disabled = false;
  }
});

// ============================================================
// ANIMATION COMPTEURS
// ============================================================

function animerCompteur(element) {
  const cible  = parseInt(element.dataset.compteur, 10);
  const duree  = 800;
  const debut  = performance.now();

  const animer = (now) => {
    const progression = Math.min((now - debut) / duree, 1);
    const ease        = 1 - Math.pow(1 - progression, 3);
    element.textContent = Math.round(cible * ease);
    if (progression < 1) requestAnimationFrame(animer);
  };

  requestAnimationFrame(animer);
}

// ============================================================
// TOASTS
// ============================================================

/**
 * Affiche une notification toast
 * @param {string} message
 * @param {'succes'|'erreur'|'info'} type
 * @param {number} duree - ms
 */
function afficherToast(message, type = 'info', duree = 4000) {
  const zone = document.getElementById('zone-toasts');
  if (!zone) return;

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-message">${echapper(message)}</span>
    <button class="toast-fermer" aria-label="Fermer la notification">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
    </button>
  `;

  const fermer = () => {
    toast.style.animation = 'toast-sortie 0.3s ease both';
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-fermer').addEventListener('click', fermer);
  setTimeout(fermer, duree);

  zone.appendChild(toast);
}

// ============================================================
// GÉNÉRATEURS UTILITAIRES
// ============================================================

function genererVide(message) {
  return `
    <div style="padding:var(--espace-8);text-align:center;
                font-family:var(--police-mono);font-size:var(--taille-xs);
                color:var(--texte-tertiaire);letter-spacing:var(--espacement-large);">
      ${echapper(message)}
    </div>
  `;
}

function genererErreur(message) {
  return `
    <div style="padding:var(--espace-6);font-family:var(--police-mono);
                font-size:var(--taille-xs);color:var(--couleur-erreur);">
      ${echapper(message)}
    </div>
  `;
}

// Export du toast pour utilisation externe
export { afficherToast };

// Styles CSS injectés pour les éléments dynamiques
const stylesDynamiques = document.createElement('style');
stylesDynamiques.textContent = `
  .element-activite {
    display: flex;
    gap: var(--espace-3);
    padding: var(--espace-3) 0;
    border-bottom: var(--bordure-fine);
  }
  .element-activite:last-child { border-bottom: none; }

  .activite-icone {
    width: 28px;
    height: 28px;
    background: var(--couleur-accent-pale);
    border: 1px solid var(--couleur-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--couleur-accent-sombre);
  }
  .activite-contenu { flex: 1; min-width: 0; }
  .activite-texte {
    font-family: var(--police-corps);
    font-size: var(--taille-sm);
    color: var(--texte-secondaire);
    line-height: var(--ligne-normale);
  }
  .activite-lien {
    color: var(--couleur-accent-sombre);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .activite-date {
    font-family: var(--police-mono);
    font-size: var(--taille-xs);
    color: var(--texte-tertiaire);
    letter-spacing: var(--espacement-large);
    display: block;
    margin-top: var(--espace-1);
  }

  .projet-item-admin {
    padding: var(--espace-3) 0;
    border-bottom: var(--bordure-fine);
  }
  .projet-item-admin:last-child { border-bottom: none; }
  .projet-item-titre {
    font-family: var(--police-corps);
    font-weight: 600;
    font-size: var(--taille-sm);
    color: var(--texte-primaire);
    text-decoration: none;
    display: block;
    margin-bottom: var(--espace-1);
    transition: color var(--transition-rapide);
  }
  .projet-item-titre:hover { color: var(--couleur-accent-sombre); }
  .projet-item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--espace-3);
  }

  @keyframes toast-sortie {
    to { transform: translateX(110%); opacity: 0; }
  }
`;
document.head.appendChild(stylesDynamiques);

// ============================================================
// DÉMARRAGE
// ============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiserTableauDeBord);
} else {
  initialiserTableauDeBord();
}
