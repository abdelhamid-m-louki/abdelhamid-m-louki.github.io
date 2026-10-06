/**
 * GABARIT HTML PARTAGÉ — TOUTES LES PAGES ADMIN
 * Génère la structure commune : sidebar, topbar, zone-toasts
 */
'use strict';

export function injecterGabaritAdmin(titrePageTopbar = 'Administration') {
  // La structure HTML est déjà dans chaque page HTML
  // Ce module fournit juste les helpers de rendu dynamique
  const topbarTitre = document.querySelector('.topbar-h1');
  if (topbarTitre) topbarTitre.textContent = titrePageTopbar;

  // Injection zone toasts si absente
  if (!document.getElementById('zone-toasts')) {
    const zone = document.createElement('div');
    zone.id        = 'zone-toasts';
    zone.className = 'zone-toasts';
    zone.setAttribute('aria-live', 'assertive');
    zone.setAttribute('role', 'status');
    document.body.appendChild(zone);
  }
}
