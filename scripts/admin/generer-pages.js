/**
 * Générateur de pages admin partagées
 * Exporte le HTML de la sidebar commune
 */
export const SIDEBAR_HTML = `
<aside class="sidebar-admin" id="sidebar-admin" aria-label="Navigation administration">
  <div class="sidebar-logo">
    <a href="/" class="sidebar-logo-lien">
      <div class="sidebar-logo-icone" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/></svg>
      </div>
      <div><div class="sidebar-logo-nom">Portfolio</div><div class="sidebar-logo-sous">Administration</div></div>
    </a>
  </div>
  <nav class="sidebar-nav" aria-label="Menu d'administration">
    <div class="sidebar-section-titre">Principal</div>
    <a href="/admin/tableau-de-bord.html" class="nav-admin-lien" data-page="tableau-de-bord">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
      Tableau de bord
    </a>
    <div class="sidebar-section-titre" style="margin-top:var(--espace-5)">Contenu</div>
    <a href="/admin/articles.html" class="nav-admin-lien" data-page="articles">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/></svg>
      Articles
    </a>
    <a href="/admin/projets.html" class="nav-admin-lien" data-page="projets">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Projets
    </a>
    <a href="/admin/medias.html" class="nav-admin-lien" data-page="medias">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      Médiathèque
    </a>
    <div class="sidebar-section-titre" style="margin-top:var(--espace-5)">Profil</div>
    <a href="/admin/competences.html" class="nav-admin-lien" data-page="competences">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      Compétences
    </a>
    <a href="/admin/experiences.html" class="nav-admin-lien" data-page="experiences">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      Expériences
    </a>
    <a href="/admin/formations.html" class="nav-admin-lien" data-page="formations">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      Formations
    </a>
    <a href="/admin/certifications.html" class="nav-admin-lien" data-page="certifications">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
      Certifications
    </a>
    <div class="sidebar-section-titre" style="margin-top:var(--espace-5)">Système</div>
    <a href="/admin/seo.html" class="nav-admin-lien" data-page="seo">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      SEO
    </a>
    <a href="/admin/utilisateurs.html" class="nav-admin-lien" data-page="utilisateurs">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
      Utilisateurs
    </a>
    <a href="/admin/parametres.html" class="nav-admin-lien" data-page="parametres">
      <svg class="nav-admin-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      Paramètres
    </a>
  </nav>
  <div class="sidebar-utilisateur">
    <div class="sidebar-utilisateur-avatar" id="avatar-utilisateur" aria-hidden="true">A</div>
    <div class="sidebar-utilisateur-info">
      <div class="sidebar-utilisateur-nom" id="nom-utilisateur">Chargement…</div>
      <div class="sidebar-utilisateur-role" id="role-utilisateur">Administrateur</div>
    </div>
    <button class="btn-deconnexion" id="btn-deconnexion" aria-label="Se déconnecter" title="Se déconnecter">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    </button>
  </div>
</aside>
`;

export const HEAD_CSS = `
  <link rel="stylesheet" href="/styles/tokens/variables.css">
  <link rel="stylesheet" href="/styles/tokens/reset.css">
  <link rel="stylesheet" href="/styles/tokens/typographie.css">
  <link rel="stylesheet" href="/styles/layouts/disposition.css">
  <link rel="stylesheet" href="/styles/components/textures.css">
  <link rel="stylesheet" href="/styles/components/formulaires.css">
  <link rel="stylesheet" href="/styles/components/cartes.css">
  <link rel="stylesheet" href="/styles/pages/admin.css">
  <link rel="stylesheet" href="/styles/pages/admin-crud.css">
`;
