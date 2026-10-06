/**
 * UTILITAIRES ADMIN PARTAGÉS
 * Portfolio Éditorial — Base commune à toutes les pages CRUD
 *
 * Fonctions réutilisables :
 * - Protection de route
 * - Toasts
 * - Modale de confirmation
 * - Éditeur de texte riche (contenteditable)
 * - Saisie de tags
 * - Upload image avec preview
 * - Génération de slug
 * - Formatage de date
 * - Indicateur de sauvegarde
 */

'use strict';

import auth, { ROLES } from '../auth/auth.js';
import stockage        from '../storage/storage-manager.js';

// ============================================================
// PROTECTION DE ROUTE
// ============================================================

export async function protegerPage(roleRequis = ROLES.EDITEUR) {
  const ok = await auth.protegerRoute(roleRequis);
  if (!ok) return false;

  // Afficher infos utilisateur dans la sidebar
  const utilisateur = auth.utilisateur;
  if (utilisateur) {
    const elemNom    = document.getElementById('nom-utilisateur');
    const elemRole   = document.getElementById('role-utilisateur');
    const elemAvatar = document.querySelector('.sidebar-utilisateur-avatar');
    if (elemNom)    elemNom.textContent    = utilisateur.nom || utilisateur.email;
    if (elemRole)   elemRole.textContent   = labelsRole[utilisateur.role] || 'Utilisateur';
    if (elemAvatar) elemAvatar.textContent = (utilisateur.nom || 'A')[0].toUpperCase();
  }

  // Bouton déconnexion
  document.getElementById('btn-deconnexion')?.addEventListener('click', async () => {
    await auth.seDeconnecter();
  });

  // Date topbar
  const elemDate = document.getElementById('topbar-date');
  if (elemDate) {
    elemDate.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Marquer lien actif dans sidebar
  const cheminActuel = window.location.pathname;
  document.querySelectorAll('.nav-admin-lien').forEach(lien => {
    const href = lien.getAttribute('href');
    const estActif = href && cheminActuel.includes(href.split('?')[0].replace('/admin/', ''));
    lien.classList.toggle('actif', estActif);
    if (estActif) lien.setAttribute('aria-current', 'page');
  });

  return true;
}

const labelsRole = { admin: 'Administrateur', editeur: 'Éditeur', lecteur: 'Lecteur' };

// ============================================================
// TOASTS
// ============================================================

export function toast(message, type = 'info', duree = 4000) {
  let zone = document.getElementById('zone-toasts');
  if (!zone) {
    zone = document.createElement('div');
    zone.id        = 'zone-toasts';
    zone.className = 'zone-toasts';
    zone.setAttribute('aria-live', 'assertive');
    zone.setAttribute('role', 'status');
    document.body.appendChild(zone);
  }

  const elem = document.createElement('div');
  elem.className = `toast ${type}`;
  elem.innerHTML = `
    <span class="toast-message">${echapper(message)}</span>
    <button class="toast-fermer" aria-label="Fermer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
    </button>
  `;

  const fermer = () => {
    elem.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    elem.style.transform  = 'translateX(110%)';
    elem.style.opacity    = '0';
    setTimeout(() => elem.remove(), 280);
  };

  elem.querySelector('.toast-fermer').addEventListener('click', fermer);
  setTimeout(fermer, duree);
  zone.appendChild(elem);
}

// ============================================================
// MODALE DE CONFIRMATION
// ============================================================

export function confirmer(options = {}) {
  return new Promise(resolve => {
    const {
      titre   = 'Confirmation',
      message = 'Êtes-vous sûr ?',
      labelOk = 'Confirmer',
      labelAnnuler = 'Annuler',
      danger  = false,
    } = options;

    // Crée la modale
    const overlay = document.createElement('div');
    overlay.className = 'modale-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modale-titre-confirm');
    overlay.innerHTML = `
      <div class="modale">
        <div class="modale-en-tete">
          <h2 class="modale-titre" id="modale-titre-confirm">${echapper(titre)}</h2>
          <button class="btn-action-crud" id="btn-fermer-modale" aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div class="modale-corps">
          <p style="font-family:var(--police-corps);color:var(--texte-secondaire);margin:0;line-height:var(--ligne-lache);">
            ${echapper(message)}
          </p>
        </div>
        <div class="modale-pied">
          <button class="btn btn-fantome btn-sm" id="btn-annuler-modale">${echapper(labelAnnuler)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primaire'} btn-sm" id="btn-ok-modale">${echapper(labelOk)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('ouverte'));

    const fermer = (resultat) => {
      overlay.classList.remove('ouverte');
      setTimeout(() => overlay.remove(), 300);
      resolve(resultat);
    };

    overlay.getElementById?.('btn-fermer-modale')  || overlay.querySelector('#btn-fermer-modale');
    overlay.querySelector('#btn-fermer-modale')?.addEventListener('click',  () => fermer(false));
    overlay.querySelector('#btn-annuler-modale')?.addEventListener('click', () => fermer(false));
    overlay.querySelector('#btn-ok-modale')?.addEventListener('click',      () => fermer(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) fermer(false); });

    // Focus sur le bouton OK
    setTimeout(() => overlay.querySelector('#btn-ok-modale')?.focus(), 100);

    // Fermer avec Échap
    const onKey = (e) => {
      if (e.key === 'Escape') { fermer(false); document.removeEventListener('keydown', onKey); }
    };
    document.addEventListener('keydown', onKey);
  });
}

// ============================================================
// ÉDITEUR DE TEXTE RICHE
// ============================================================

export function initialiserEditeur(zoneId, options = {}) {
  const zone = document.getElementById(zoneId);
  if (!zone) return null;

  zone.setAttribute('contenteditable', 'true');
  zone.setAttribute('data-placeholder', options.placeholder || 'Commencez à écrire…');
  zone.setAttribute('role', 'textbox');
  zone.setAttribute('aria-multiline', 'true');
  zone.setAttribute('aria-label', options.label || 'Éditeur de contenu');
  zone.setAttribute('spellcheck', 'true');
  zone.setAttribute('lang', 'fr');

  // Préremplir
  if (options.contenu) zone.innerHTML = options.contenu;

  const commandes = {
    'btn-gras':     () => document.execCommand('bold'),
    'btn-italique': () => document.execCommand('italic'),
    'btn-souligne': () => document.execCommand('underline'),
    'btn-h2':       () => document.execCommand('formatBlock', false, 'h2'),
    'btn-h3':       () => document.execCommand('formatBlock', false, 'h3'),
    'btn-para':     () => document.execCommand('formatBlock', false, 'p'),
    'btn-liste-ul': () => document.execCommand('insertUnorderedList'),
    'btn-liste-ol': () => document.execCommand('insertOrderedList'),
    'btn-quote':    () => document.execCommand('formatBlock', false, 'blockquote'),
    'btn-lien':     () => {
      const url = prompt('URL du lien :');
      if (url) document.execCommand('createLink', false, url);
    },
    'btn-effacer-format': () => document.execCommand('removeFormat'),
  };

  Object.entries(commandes).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      zone.focus();
      fn();
      mettreAJourBoutons();
    });
  });

  // Mettre à jour l'état des boutons selon la sélection
  function mettreAJourBoutons() {
    const etats = {
      'btn-gras':     document.queryCommandState('bold'),
      'btn-italique': document.queryCommandState('italic'),
      'btn-souligne': document.queryCommandState('underline'),
    };
    Object.entries(etats).forEach(([id, actif]) => {
      document.getElementById(id)?.classList.toggle('actif', actif);
    });
  }

  zone.addEventListener('keyup', mettreAJourBoutons);
  zone.addEventListener('mouseup', mettreAJourBoutons);
  document.addEventListener('selectionchange', mettreAJourBoutons);

  // Empêcher la touche Tab de changer le focus
  zone.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  });

  return {
    getHTML:    () => zone.innerHTML,
    setHTML:    (html) => { zone.innerHTML = html; },
    getText:    () => zone.innerText,
    vider:      () => { zone.innerHTML = ''; },
    focus:      () => zone.focus(),
  };
}

// ============================================================
// SAISIE DE TAGS
// ============================================================

export function initialiserSaisieTags(conteneurId, options = {}) {
  const conteneur = document.getElementById(conteneurId);
  if (!conteneur) return null;

  let tags = [...(options.tagsInitiaux || [])];

  const rendu = () => {
    conteneur.innerHTML = tags.map(tag => `
      <span class="tag-badge" data-tag="${echapper(tag)}">
        ${echapper(tag)}
        <button class="tag-badge-suppr" data-tag="${echapper(tag)}" aria-label="Supprimer le tag ${echapper(tag)}" type="button">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </span>
    `).join('') + `
      <input type="text"
             class="saisie-tags-champ"
             placeholder="${echapper(options.placeholder || 'Ajouter un tag…')}"
             aria-label="Ajouter un tag"
             autocomplete="off">
    `;

    conteneur.querySelectorAll('.tag-badge-suppr').forEach(btn => {
      btn.addEventListener('click', () => {
        tags = tags.filter(t => t !== btn.dataset.tag);
        rendu();
        options.onChange?.(tags);
      });
    });

    const champ = conteneur.querySelector('.saisie-tags-champ');
    champ?.addEventListener('keydown', e => {
      const valeur = champ.value.trim();
      if ((e.key === 'Enter' || e.key === ',') && valeur) {
        e.preventDefault();
        const nouveauTag = valeur.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        if (!tags.includes(nouveauTag)) {
          tags.push(nouveauTag);
          rendu();
          options.onChange?.(tags);
        } else {
          champ.value = '';
        }
      }
      if (e.key === 'Backspace' && !valeur && tags.length > 0) {
        tags.pop();
        rendu();
        options.onChange?.(tags);
      }
    });

    // Clic sur le conteneur → focus le champ
    conteneur.addEventListener('click', e => {
      if (!e.target.closest('.tag-badge')) champ?.focus();
    });
  };

  rendu();

  return {
    getTags:  () => [...tags],
    setTags:  (t) => { tags = [...t]; rendu(); },
    ajouter:  (t) => { if (!tags.includes(t)) { tags.push(t); rendu(); } },
    vider:    () => { tags = []; rendu(); },
  };
}

// ============================================================
// UPLOAD IMAGE AVEC PREVIEW
// ============================================================

export function initialiserUploadImage(options = {}) {
  const {
    inputId      = 'input-image',
    previewId    = 'preview-image',
    zoneId       = 'zone-upload',
    barreId      = 'barre-upload',
    supprimerId  = 'btn-supprimer-image',
    destination  = 'medias',
    onURL        = null,
  } = options;

  const input      = document.getElementById(inputId);
  const preview    = document.getElementById(previewId);
  const zone       = document.getElementById(zoneId);
  const barre      = document.getElementById(barreId);
  const btnSuppr   = document.getElementById(supprimerId);
  let urlActuelle  = options.urlInitiale || '';

  const afficherPreview = (url) => {
    urlActuelle = url;
    if (preview) {
      preview.src = url;
      preview.closest('.preview-image-wrapper')?.classList.add('visible');
    }
    if (zone) zone.style.display = 'none';
    onURL?.(url);
  };

  const reinitialiser = () => {
    urlActuelle = '';
    if (preview) {
      preview.src = '';
      preview.closest('.preview-image-wrapper')?.classList.remove('visible');
    }
    if (zone) zone.style.display = '';
    if (input) input.value = '';
    onURL?.('');
  };

  if (urlActuelle) afficherPreview(urlActuelle);

  btnSuppr?.addEventListener('click', reinitialiser);

  const traiterFichier = async (fichier) => {
    if (!fichier?.type.startsWith('image/')) {
      toast('Seules les images sont acceptées.', 'erreur');
      return;
    }

    // Preview immédiate
    const urlTemp = URL.createObjectURL(fichier);
    afficherPreview(urlTemp);

    // Barre progression
    if (barre) {
      barre.classList.add('visible');
      const fill = barre.querySelector('.barre-upload-fill');
      if (fill) fill.style.transform = 'scaleX(0.3)';
    }

    try {
      const { upload } = await import('../utils/upload.js');
      const { url } = await upload.traiterEtUploader(fichier, {
        destination,
        preset: 'COUVERTURE',
        onProgression: (pct) => {
          const fill = barre?.querySelector('.barre-upload-fill');
          if (fill) fill.style.transform = `scaleX(${pct / 100})`;
        },
      });

      URL.revokeObjectURL(urlTemp);
      afficherPreview(url);
      toast('Image uploadée avec succès.', 'succes');
    } catch (err) {
      // On garde la preview locale si l'upload échoue
      toast(`Erreur upload : ${err.message}`, 'erreur');
    } finally {
      if (barre) barre.classList.remove('visible');
    }
  };

  input?.addEventListener('change', e => {
    const fichier = e.target.files?.[0];
    if (fichier) traiterFichier(fichier);
  });

  // Drag & drop
  if (zone) {
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('glisser-dessus'); });
    zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('glisser-dessus'); });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('glisser-dessus');
      const fichier = e.dataTransfer?.files?.[0];
      if (fichier) traiterFichier(fichier);
    });
  }

  return {
    getURL:       () => urlActuelle,
    setURL:       afficherPreview,
    reinitialiser,
  };
}

// ============================================================
// GÉNÉRATION DE SLUG
// ============================================================

export function slugifier(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80);
}

// Auto-génération du slug depuis un champ titre
export function lierSlugAuTitre(titreId, slugId) {
  const champTitre = document.getElementById(titreId);
  const champSlug  = document.getElementById(slugId);
  if (!champTitre || !champSlug) return;

  let modifieManuel = !!champSlug.value;

  champTitre.addEventListener('input', () => {
    if (!modifieManuel) champSlug.value = slugifier(champTitre.value);
  });

  champSlug.addEventListener('input', () => {
    modifieManuel = !!champSlug.value;
  });

  champSlug.addEventListener('blur', () => {
    champSlug.value = slugifier(champSlug.value);
  });
}

// ============================================================
// INDICATEUR DE SAUVEGARDE
// ============================================================

export function indicateurSauvegarde(elemId) {
  const elem = document.getElementById(elemId);
  if (!elem) return { succes: () => {}, erreur: () => {}, chargement: () => {} };

  let timer = null;

  const afficher = (texte, classe, duree = 3000) => {
    clearTimeout(timer);
    elem.textContent = texte;
    elem.className   = `indicateur-sauvegarde visible ${classe}`;
    if (duree > 0) timer = setTimeout(() => elem.classList.remove('visible'), duree);
  };

  return {
    chargement: () => afficher('Sauvegarde…', '', 0),
    succes:     (msg = 'Sauvegardé') => afficher(msg, 'sauvegarde'),
    erreur:     (msg = 'Erreur')     => afficher(msg, 'erreur'),
    cacher:     ()  => { clearTimeout(timer); elem.classList.remove('visible'); },
  };
}

// ============================================================
// LIRE LES PARAMS URL
// ============================================================

export function lireParamsURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    id:     params.get('id')     || null,
    action: params.get('action') || null,
    page:   parseInt(params.get('page') || '1', 10),
    filtre: params.get('filtre') || null,
    q:      params.get('q')      || '',
  };
}

// ============================================================
// FORMATAGE
// ============================================================

export function formaterDate(dateIso) {
  if (!dateIso) return '—';
  try {
    return new Date(dateIso).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (_) { return dateIso; }
}

export function formaterDateInput(dateIso) {
  if (!dateIso) return '';
  try { return new Date(dateIso).toISOString().split('T')[0]; }
  catch (_) { return ''; }
}

export function echapper(texte) {
  if (!texte) return '';
  return String(texte)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// PAGINATION ADMIN
// ============================================================

export function rendrePaginationAdmin(conteneurId, { page, total, parPage, onChange }) {
  const conteneur = document.getElementById(conteneurId);
  if (!conteneur) return;

  const totalPages = Math.ceil(total / parPage);
  if (totalPages <= 1) { conteneur.innerHTML = ''; return; }

  const boutons = [];

  boutons.push(`<button class="btn btn-fantome btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Page précédente">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
  </button>`);

  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
    boutons.push(`<button class="btn ${p === page ? 'btn-accent' : 'btn-fantome'} btn-sm" data-page="${p}" ${p === page ? 'aria-current="page"' : ''}>${p}</button>`);
  }

  boutons.push(`<button class="btn btn-fantome btn-sm" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Page suivante">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
  </button>`);

  conteneur.innerHTML = `<div style="display:flex;align-items:center;gap:var(--espace-2);justify-content:center;margin-top:var(--espace-6);">${boutons.join('')}</div>`;

  conteneur.querySelectorAll('[data-page]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onChange(parseInt(btn.dataset.page)));
  });
}
