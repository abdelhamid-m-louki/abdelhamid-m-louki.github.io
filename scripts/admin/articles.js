/**
 * GESTION DES ARTICLES — ADMINISTRATION
 * Portfolio Éditorial
 *
 * CRUD complet : liste paginée, éditeur riche, tags, image,
 * métadonnées SEO, assistant IA, sauvegarde automatique.
 */

'use strict';

import stockage, { COLLECTIONS } from '../storage/storage-manager.js';
import ia, { ACTIONS }           from '../ai/ia.js';
import {
  protegerPage, toast, confirmer,
  initialiserEditeur, initialiserSaisieTags,
  initialiserUploadImage, slugifier, lierSlugAuTitre,
  indicateurSauvegarde, lireParamsURL,
  formaterDate, formaterDateInput, echapper,
  rendrePaginationAdmin,
} from './utils-admin.js';

// ============================================================
// ÉTAT
// ============================================================

const etat = {
  vue:         'liste',   // 'liste' | 'editeur'
  page:        1,
  parPage:     12,
  total:       0,
  filtreStat:  '',
  filtreCat:   '',
  recherche:   '',
  articleId:   null,      // null = création, string = édition
  editeur:     null,      // instance de l'éditeur riche
  gestTags:    null,      // instance du gestionnaire de tags
  gestImage:   null,      // instance de l'upload image
  indicSauv:   null,      // indicateur de sauvegarde
  timerAuto:   null,      // timer sauvegarde auto
};

// ============================================================
// INITIALISATION
// ============================================================

async function init() {
  const ok = await protegerPage();
  if (!ok) return;

  etat.indicSauv = indicateurSauvegarde('indicateur-sauvegarde');

  brancherListeEvenements();
  await chargerCategories();

  const params = lireParamsURL();
  if (params.action === 'nouveau') {
    afficherEditeur(null);
  } else if (params.id) {
    await afficherEditeur(params.id);
  } else {
    await chargerListe();
  }
}

// ============================================================
// LISTE DES ARTICLES
// ============================================================

async function chargerListe() {
  const tbody = document.getElementById('corps-tableau-articles');
  if (!tbody) return;

  tbody.innerHTML = lignesChargement(5);

  try {
    const options = {
      parPage: etat.parPage,
      page:    etat.page,
      tri:     'modifie_le',
      ordre:   'desc',
    };

    const filtres = {};
    if (etat.filtreStat) filtres.statut    = etat.filtreStat;
    if (etat.filtreCat)  filtres.categorie = etat.filtreCat;
    if (Object.keys(filtres).length) options.filtres = filtres;

    if (etat.recherche.length >= 2) {
      options.recherche        = etat.recherche;
      options.champsRecherche  = ['titre', 'extrait', 'contenu'];
    }

    const { donnees, total } = await stockage.obtenirTous(COLLECTIONS.ARTICLES, options);
    etat.total = total;

    document.getElementById('compteur-articles').textContent =
      `${total} article${total > 1 ? 's' : ''}`;

    if (!donnees?.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:var(--espace-10);font-family:var(--police-mono);font-size:var(--taille-xs);color:var(--texte-tertiaire);letter-spacing:var(--espacement-large);">Aucun article trouvé.</td></tr>`;
    } else {
      tbody.innerHTML = donnees.map(art => ligneArticle(art)).join('');
      attacherActionsLigne();
    }

    rendrePaginationAdmin('pagination-articles', {
      page: etat.page, total, parPage: etat.parPage,
      onChange: async (p) => { etat.page = p; await chargerListe(); }
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:var(--espace-6);color:var(--couleur-erreur);font-family:var(--police-mono);font-size:var(--taille-xs);">Erreur : ${echapper(err.message)}</td></tr>`;
  }
}

function ligneArticle(art) {
  const classes = { 'publié': 'badge-statut-publie', 'brouillon': 'badge-statut-brouillon', 'archivé': 'badge-statut-archive' };
  return `
    <tr>
      <td class="col-checkbox"><input type="checkbox" class="case-cochee check-article" data-id="${echapper(art.id)}" aria-label="Sélectionner ${echapper(art.titre)}"></td>
      <td class="col-image">
        ${art.image_couverture
          ? `<img src="${echapper(art.image_couverture)}" class="miniature-tableau" alt="" aria-hidden="true">`
          : `<div class="miniature-placeholder" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`
        }
      </td>
      <td>
        <button class="titre-crud-lien" data-action="editer" data-id="${echapper(art.id)}" title="${echapper(art.titre)}">${echapper(art.titre || 'Sans titre')}</button>
        <div class="sous-titre-crud">${echapper(art.slug || '')}</div>
      </td>
      <td><span class="badge-statut ${classes[art.statut] || 'badge-statut-brouillon'}">${echapper(art.statut || 'brouillon')}</span></td>
      <td style="font-size:var(--taille-xs);color:var(--texte-tertiaire);font-family:var(--police-mono);">${echapper(art.categorie || '—')}</td>
      <td style="font-size:var(--taille-xs);color:var(--texte-tertiaire);font-family:var(--police-mono);">${formaterDate(art.date_publication)}</td>
      <td style="font-size:var(--taille-xs);color:var(--texte-tertiaire);font-family:var(--police-mono);">${art.vues ?? 0}</td>
      <td class="col-actions">
        <div class="actions-crud">
          <button class="btn-action-crud" data-action="editer" data-id="${echapper(art.id)}" title="Modifier" aria-label="Modifier ${echapper(art.titre)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          ${art.slug ? `<a class="btn-action-crud" href="/blog/${echapper(art.slug)}.html" target="_blank" rel="noopener" title="Voir" aria-label="Voir l'article">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ''}
          <button class="btn-action-crud danger" data-action="supprimer" data-id="${echapper(art.id)}" data-titre="${echapper(art.titre)}" title="Supprimer" aria-label="Supprimer ${echapper(art.titre)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function attacherActionsLigne() {
  document.querySelectorAll('[data-action="editer"]').forEach(btn => {
    btn.addEventListener('click', () => afficherEditeur(btn.dataset.id));
  });
  document.querySelectorAll('[data-action="supprimer"]').forEach(btn => {
    btn.addEventListener('click', () => supprimerArticle(btn.dataset.id, btn.dataset.titre));
  });
}

async function supprimerArticle(id, titre) {
  const ok = await confirmer({
    titre: 'Supprimer l\'article',
    message: `Voulez-vous vraiment supprimer « ${titre} » ? Cette action est irréversible.`,
    labelOk: 'Supprimer',
    danger: true,
  });
  if (!ok) return;
  try {
    await stockage.supprimer(COLLECTIONS.ARTICLES, id);
    toast('Article supprimé.', 'succes');
    await chargerListe();
  } catch (err) {
    toast(`Erreur : ${err.message}`, 'erreur');
  }
}

function lignesChargement(n) {
  return Array.from({ length: n }, () => `
    <tr>
      <td colspan="8" style="padding:var(--espace-3)">
        <div class="squelette-texte" style="height:18px;"></div>
      </td>
    </tr>`).join('');
}

// ============================================================
// ÉDITEUR D'ARTICLE
// ============================================================

async function afficherEditeur(id) {
  basculerVue('editeur');
  etat.articleId = id || null;

  // Initialiser les sous-modules
  etat.editeur = initialiserEditeur('zone-editeur', {
    placeholder: 'Commencez à écrire le contenu de votre article…',
    label: 'Contenu de l\'article',
  });

  etat.gestTags = initialiserSaisieTags('saisie-tags-article', {
    placeholder: 'Ajouter un tag…',
  });

  etat.gestImage = initialiserUploadImage({
    inputId:     'input-couverture',
    previewId:   'preview-image-couverture',
    zoneId:      'zone-upload-couverture',
    barreId:     'barre-upload-couverture',
    supprimerId: 'btn-supprimer-couverture',
    destination: 'blog/couvertures',
    onURL: (url) => {
      document.getElementById('champ-image-couverture').value = url;
    },
  });

  lierSlugAuTitre('champ-titre', 'champ-slug');
  initialiserCompteursCaracteres();
  initialiserSauvegardeAuto();

  if (id) {
    document.getElementById('topbar-h1').textContent = 'Modifier l\'article';
    await chargerArticle(id);
  } else {
    document.getElementById('topbar-h1').textContent = 'Nouvel article';
    document.getElementById('champ-date-pub').value = formaterDateInput(new Date().toISOString());
  }
}

async function chargerArticle(id) {
  try {
    const article = await stockage.obtenirParId(COLLECTIONS.ARTICLES, id);
    document.getElementById('article-id-cache').value = article.id;
    document.getElementById('champ-titre').value        = article.titre || '';
    document.getElementById('champ-slug').value         = article.slug  || '';
    document.getElementById('champ-extrait').value      = article.extrait || '';
    document.getElementById('champ-statut').value       = article.statut  || 'brouillon';
    document.getElementById('champ-date-pub').value     = formaterDateInput(article.date_publication);
    document.getElementById('champ-vedette').checked    = !!article.vedette;
    document.getElementById('champ-meta-titre').value   = article.meta_titre || '';
    document.getElementById('champ-meta-desc').value    = article.meta_description || '';
    document.getElementById('champ-temps-lecture').value = article.temps_lecture || '';
    document.getElementById('champ-categorie-article').value = article.categorie || '';

    etat.editeur?.setHTML(article.contenu || '');
    etat.gestTags?.setTags(article.tags || []);
    if (article.image_couverture) etat.gestImage?.setURL(article.image_couverture);

    mettreAJourCompteurs();
  } catch (err) {
    toast(`Impossible de charger l'article : ${err.message}`, 'erreur');
    basculerVue('liste');
  }
}

// ============================================================
// SAUVEGARDE
// ============================================================

async function sauvegarder(publier = false) {
  const titre = document.getElementById('champ-titre').value.trim();
  if (!titre) { toast('Le titre est obligatoire.', 'erreur'); document.getElementById('champ-titre').focus(); return; }

  etat.indicSauv.chargement();

  const donnees = {
    titre,
    slug:             document.getElementById('champ-slug').value || slugifier(titre),
    extrait:          document.getElementById('champ-extrait').value.trim(),
    contenu:          etat.editeur?.getHTML() || '',
    statut:           publier ? 'publié' : document.getElementById('champ-statut').value,
    date_publication: publier
      ? (document.getElementById('champ-date-pub').value || new Date().toISOString())
      : document.getElementById('champ-date-pub').value || null,
    vedette:          document.getElementById('champ-vedette').checked,
    categorie:        document.getElementById('champ-categorie-article').value,
    tags:             etat.gestTags?.getTags() || [],
    image_couverture: document.getElementById('champ-image-couverture').value || null,
    meta_titre:       document.getElementById('champ-meta-titre').value.trim(),
    meta_description: document.getElementById('champ-meta-desc').value.trim(),
    temps_lecture:    parseInt(document.getElementById('champ-temps-lecture').value) || estimerTempsLecture(),
    nombre_mots:      compterMots(),
  };

  try {
    if (etat.articleId) {
      await stockage.metAJour(COLLECTIONS.ARTICLES, etat.articleId, donnees);
    } else {
      const nouvel = await stockage.creer(COLLECTIONS.ARTICLES, donnees);
      etat.articleId = nouvel.id;
      document.getElementById('article-id-cache').value = nouvel.id;
      history.replaceState({}, '', `?id=${nouvel.id}`);
    }
    etat.indicSauv.succes(publier ? 'Publié !' : 'Sauvegardé');
    toast(publier ? 'Article publié avec succès.' : 'Article sauvegardé.', 'succes');
  } catch (err) {
    etat.indicSauv.erreur('Erreur');
    toast(`Erreur : ${err.message}`, 'erreur');
  }
}

function initialiserSauvegardeAuto() {
  const champsTitre   = document.getElementById('champ-titre');
  const champsExtrait = document.getElementById('champ-extrait');

  const onChangement = () => {
    clearTimeout(etat.timerAuto);
    etat.timerAuto = setTimeout(() => {
      if (etat.articleId) sauvegarder(false);
    }, 30000); // Auto-save toutes les 30s si déjà créé
  };

  champsTitre?.addEventListener('input', onChangement);
  champsExtrait?.addEventListener('input', onChangement);
  document.getElementById('zone-editeur')?.addEventListener('input', onChangement);
}

// ============================================================
// COMPTEURS SEO
// ============================================================

function initialiserCompteursCaracteres() {
  const champTitre = document.getElementById('champ-meta-titre');
  const champDesc  = document.getElementById('champ-meta-desc');
  const cptTitre   = document.getElementById('compteur-meta-titre');
  const cptDesc    = document.getElementById('compteur-meta-desc');

  const mettreAJour = (champ, cpt, max) => {
    if (!champ || !cpt) return;
    const n = champ.value.length;
    cpt.textContent = `(${n}/${max})`;
    cpt.style.color = n > max * 0.9 ? 'var(--couleur-erreur)' : 'var(--texte-tertiaire)';
  };

  champTitre?.addEventListener('input', () => mettreAJour(champTitre, cptTitre, 60));
  champDesc?.addEventListener('input',  () => mettreAJour(champDesc,  cptDesc,  160));
}

function mettreAJourCompteurs() {
  const champTitre = document.getElementById('champ-meta-titre');
  const champDesc  = document.getElementById('champ-meta-desc');
  const cptTitre   = document.getElementById('compteur-meta-titre');
  const cptDesc    = document.getElementById('compteur-meta-desc');
  if (champTitre && cptTitre) cptTitre.textContent = `(${champTitre.value.length}/60)`;
  if (champDesc  && cptDesc)  cptDesc.textContent  = `(${champDesc.value.length}/160)`;
}

function estimerTempsLecture() {
  const texte = etat.editeur?.getText() || '';
  return Math.max(1, Math.ceil(texte.split(/\s+/).length / 200));
}

function compterMots() {
  const texte = etat.editeur?.getText() || '';
  return texte.trim() ? texte.trim().split(/\s+/).length : 0;
}

// ============================================================
// ASSISTANT IA
// ============================================================

async function executerIA(action) {
  const contenu = etat.editeur?.getText() || document.getElementById('champ-titre').value;
  if (!contenu.trim()) { toast('Ajoutez du contenu avant d\'utiliser l\'assistant IA.', 'erreur'); return; }

  const fournisseur = document.getElementById('fournisseur-ia')?.value || 'gemini';
  ia.definirFournisseur(fournisseur);

  const divChargement = document.getElementById('ia-chargement');
  const divResultat   = document.getElementById('ia-resultat');
  divChargement.style.display = 'block';
  divResultat.style.display   = 'none';

  try {
    let resultat;
    switch (action) {
      case 'resumer':
        resultat = await ia.resumer(contenu);
        document.getElementById('champ-extrait').value = resultat;
        toast('Résumé généré et appliqué à l\'extrait.', 'succes');
        break;
      case 'titres':
        const titres = await ia.genererTitres(contenu);
        divResultat.innerHTML = `<strong style="font-family:var(--police-condensee);font-size:var(--taille-xs);letter-spacing:var(--espacement-large);text-transform:uppercase;">Titres suggérés :</strong><ul style="margin:var(--espace-3) 0 0;padding-left:var(--espace-5);">${(titres || []).map(t => `<li style="margin-bottom:var(--espace-2);cursor:pointer;" class="titre-suggere">${echapper(t)}</li>`).join('')}</ul>`;
        divResultat.style.display = 'block';
        divResultat.querySelectorAll('.titre-suggere').forEach(li => {
          li.addEventListener('click', () => {
            document.getElementById('champ-titre').value = li.textContent;
            document.getElementById('champ-slug').value  = slugifier(li.textContent);
          });
        });
        break;
      case 'tags':
        const tags = await ia.genererTags(contenu);
        (tags || []).forEach(t => etat.gestTags?.ajouter(t));
        toast(`${(tags || []).length} tags ajoutés.`, 'succes');
        break;
      case 'humaniser':
        const texteH = await ia.humaniser(contenu);
        etat.editeur?.setHTML(`<p>${texteH}</p>`);
        toast('Texte humanisé appliqué.', 'succes');
        break;
      case 'seo':
        const meta = await ia.genererMeta(contenu);
        if (meta.titre)   document.getElementById('champ-meta-titre').value = meta.titre;
        if (meta.description) document.getElementById('champ-meta-desc').value = meta.description;
        if (meta.motsClés?.length) meta.motsClés.forEach(t => etat.gestTags?.ajouter(t));
        mettreAJourCompteurs();
        toast('Métadonnées SEO générées.', 'succes');
        break;
      case 'ameliorer':
        const texteA = await ia.ameliorer(etat.editeur?.getText() || '');
        etat.editeur?.setHTML(`<p>${texteA}</p>`);
        toast('Contenu amélioré.', 'succes');
        break;
    }
  } catch (err) {
    toast(`Erreur IA : ${err.message}`, 'erreur');
  } finally {
    divChargement.style.display = 'none';
  }
}

// ============================================================
// CHARGEMENT DES CATÉGORIES
// ============================================================

async function chargerCategories() {
  try {
    const { donnees } = await stockage.obtenirTous(COLLECTIONS.CATEGORIES, { tri: 'nom' });
    const selectFiltre = document.getElementById('filtre-categorie');
    const selectEdit   = document.getElementById('champ-categorie-article');
    const options = donnees.map(c => `<option value="${echapper(c.nom)}">${echapper(c.nom)}</option>`).join('');
    if (selectFiltre) selectFiltre.innerHTML += options;
    if (selectEdit)   selectEdit.innerHTML   += options;
  } catch (_) {}
}

// ============================================================
// BASCULEMENT VUE LISTE / ÉDITEUR
// ============================================================

function basculerVue(vue) {
  etat.vue = vue;
  document.getElementById('vue-liste').style.display    = vue === 'liste' ? '' : 'none';
  document.getElementById('vue-editeur').style.display  = vue === 'editeur' ? '' : 'none';
  document.getElementById('btn-retour-liste').style.display  = vue === 'editeur' ? '' : 'none';
  document.getElementById('btn-nouvel-article').style.display = vue === 'liste' ? '' : 'none';

  if (vue === 'liste') {
    etat.articleId = null;
    clearTimeout(etat.timerAuto);
    document.getElementById('topbar-h1').textContent = 'Articles';
    history.replaceState({}, '', '/admin/articles.html');
  }
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================

function brancherListeEvenements() {
  // Navigation
  document.getElementById('btn-nouvel-article')?.addEventListener('click', () => afficherEditeur(null));
  document.getElementById('btn-retour-liste')?.addEventListener('click', async () => {
    basculerVue('liste');
    await chargerListe();
  });

  // Sauvegarde
  document.getElementById('btn-brouillon')?.addEventListener('click', () => sauvegarder(false));
  document.getElementById('btn-publier')?.addEventListener('click',   () => sauvegarder(true));

  // Filtres liste
  let timerRecherche = null;
  document.getElementById('recherche-articles')?.addEventListener('input', e => {
    clearTimeout(timerRecherche);
    timerRecherche = setTimeout(async () => {
      etat.recherche = e.target.value.trim();
      etat.page = 1;
      await chargerListe();
    }, 320);
  });

  document.getElementById('filtre-statut')?.addEventListener('change', async e => {
    etat.filtreStat = e.target.value;
    etat.page = 1;
    await chargerListe();
  });

  document.getElementById('filtre-categorie')?.addEventListener('change', async e => {
    etat.filtreCat = e.target.value;
    etat.page = 1;
    await chargerListe();
  });

  // Sélection globale
  document.getElementById('tout-selectionner')?.addEventListener('change', e => {
    document.querySelectorAll('.check-article').forEach(c => c.checked = e.target.checked);
  });

  // IA
  document.getElementById('btn-ia-resumer')?.addEventListener('click',   () => executerIA('resumer'));
  document.getElementById('btn-ia-titres')?.addEventListener('click',    () => executerIA('titres'));
  document.getElementById('btn-ia-tags')?.addEventListener('click',      () => executerIA('tags'));
  document.getElementById('btn-ia-humaniser')?.addEventListener('click', () => executerIA('humaniser'));
  document.getElementById('btn-ia-ameliorer')?.addEventListener('click', () => executerIA('ameliorer'));
  document.getElementById('btn-ia-seo')?.addEventListener('click',       () => executerIA('seo'));

  // Raccourci clavier Ctrl+S
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && etat.vue === 'editeur') {
      e.preventDefault();
      sauvegarder(false);
    }
  });
}

// ============================================================
// DÉMARRAGE
// ============================================================

document.addEventListener('DOMContentLoaded', init);
