'use strict';

const typeIcons = { article:'file-text', event:'calendar-days', course:'graduation-cap', sport:'dumbbell' };
const typeLabels = { article:{ar:'مقال',fr:'Article'}, event:{ar:'فعالية',fr:'Événement'}, course:{ar:'دورة',fr:'Formation'}, sport:{ar:'رياضة',fr:'Sport'} };
const backLinks = { article:'articles.html', event:'events.html', course:'courses.html', sport:'sports.html' };

async function loadPost() {
  const id = getParam('id');
  const type = getParam('type') || 'article';

  if (!id) { showError(); return; }

  try {
    const item = await getPostById(id, type);
    if (!item) { showError(); return; }

    const lang = App.lang;
    const title = lang === 'ar' ? item.title_ar : (item.title_fr || item.title_ar);
    const content = lang === 'ar' ? item.content_ar : (item.content_fr || item.content_ar);
    const date = formatDate(item.date_published || item.date_start || item.date_created);

    document.title = `${title} — جمعية سنابل`;
    document.querySelector('meta[name="description"]').content = item.excerpt_ar || title;

    // Hero
    const heroImg = document.getElementById('postHeroImg');
    if (item.image && heroImg) {
      heroImg.src = item.image;
      heroImg.alt = item.image_alt_ar || title;
    } else {
      document.getElementById('postHero').style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%)';
    }
    document.getElementById('postTitle').textContent = title;

    // Badges
    const badgesEl = document.getElementById('postBadges');
    const icon = typeIcons[type] || 'file-text';
    const label = typeLabels[type]?.[lang] || '';
    badgesEl.innerHTML = `
      <span class="badge" style="background:rgba(255,255,255,0.20);color:white;border-color:rgba(255,255,255,0.40)">
        <i data-lucide="${icon}" style="width:12px;height:12px"></i> ${label}
      </span>
    `;

    // Meta bar
    document.getElementById('postMeta').innerHTML = `
      <div class="meta-item"><i data-lucide="calendar" aria-hidden="true"></i><span>${date}</span></div>
      ${item.author ? `<div class="meta-item"><i data-lucide="user" aria-hidden="true"></i><span>${sanitize(item.author)}</span></div>` : ''}
      ${item.views ? `<div class="meta-item"><i data-lucide="eye" aria-hidden="true"></i><span>${formatNumber(item.views)} مشاهدة</span></div>` : ''}
      <div class="meta-item" style="margin-inline-start:auto">
        <button onclick="navigator.share ? navigator.share({title:'${sanitize(title)}',url:location.href}) : navigator.clipboard.writeText(location.href)"
          class="btn btn-ghost btn-sm" aria-label="مشاركة">
          <i data-lucide="share-2" style="width:14px;height:14px"></i> مشاركة
        </button>
      </div>
    `;

    // Event info block
    if (type === 'event') {
      const eb = document.getElementById('eventInfoBlock');
      const ec = document.getElementById('eventInfoContent');
      eb.style.display = '';
      const dateStart = formatDate(item.date_start);
      const dateTime = item.date_start ? new Date(item.date_start).toLocaleTimeString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      const loc = lang === 'ar' ? item.location_ar : (item.location_fr || item.location_ar);
      ec.innerHTML = `
        <div class="event-info-row"><i data-lucide="calendar-days" aria-hidden="true"></i><span>${dateStart}${dateTime ? ' — ' + dateTime : ''}</span></div>
        ${loc ? `<div class="event-info-row"><i data-lucide="map-pin" aria-hidden="true"></i><span>${sanitize(loc)}</span></div>` : ''}
        ${item.capacity ? `<div class="event-info-row"><i data-lucide="users" aria-hidden="true"></i><span>السعة: ${formatNumber(item.capacity)} مقعد — ${formatNumber(item.registered||0)} مسجل</span></div>` : ''}
      `;
    }

    // Course/sport extra info
    if (type === 'course') {
      const extras = [];
      if (item.duration_ar) extras.push(`<div class="event-info-row"><i data-lucide="clock" aria-hidden="true"></i><span>${lang === 'ar' ? item.duration_ar : item.duration_fr}</span></div>`);
      if (item.level_ar) extras.push(`<div class="event-info-row"><i data-lucide="bar-chart-2" aria-hidden="true"></i><span>${lang === 'ar' ? item.level_ar : item.level_fr}</span></div>`);
      if (extras.length) {
        const eb = document.getElementById('eventInfoBlock');
        eb.style.display = '';
        document.getElementById('eventInfoContent').innerHTML = extras.join('');
        eb.querySelector('a').style.display = 'none';
      }
    }

    // Body content
    const bodyEl = document.getElementById('postBody');
    const paragraphs = (content || '').split('\n').filter(p => p.trim());
    bodyEl.innerHTML = paragraphs.map(p => `<p>${sanitize(p)}</p>`).join('');

    // Gallery
    if (item.gallery && item.gallery.length) {
      document.getElementById('gallerySection').style.display = '';
      const grid = document.getElementById('galleryGrid');
      grid.innerHTML = item.gallery.map((src, i) => `
        <div class="gallery-item" data-lightbox="${src}" data-caption="">
          <img src="${src}" alt="صورة ${i+1}" loading="lazy">
          <div class="gallery-item-overlay"><i data-lucide="zoom-in" style="width:28px;height:28px;color:white"></i></div>
        </div>
      `).join('');
      Lightbox.initGallery(grid);
    }

    // Related
    if (item.related_ids && item.related_ids.length) {
      const related = await ArticlesDB.getRelated(item.related_ids);
      if (related.length) {
        document.getElementById('relatedSection').style.display = '';
        document.getElementById('relatedGrid').innerHTML = related.map(r => {
          const t = lang === 'ar' ? r.title_ar : (r.title_fr || r.title_ar);
          return `
            <a href="post.html?id=${r.id}&type=${r.type||'article'}" class="related-card">
              ${r.image ? `<img class="related-thumb" src="${r.image}" alt="${sanitize(t)}" loading="lazy">` : `<div class="related-thumb"></div>`}
              <div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:4px">${sanitize(t)}</div>
                <div style="font-size:12px;color:var(--text-muted)">${formatDate(r.date_published)}</div>
              </div>
            </a>`;
        }).join('');
      }
    }

    // Prev/Next navigation
    const allItems = await getAllOfType(type);
    const idx = allItems.findIndex(a => a.id === id);
    const prevBtn = document.getElementById('prevPost');
    const nextBtn = document.getElementById('nextPost');
    if (idx > 0) { prevBtn.href = `post.html?id=${allItems[idx-1].id}&type=${type}`; }
    else { prevBtn.style.opacity = '0.4'; prevBtn.setAttribute('aria-disabled','true'); prevBtn.removeAttribute('href'); }
    if (idx < allItems.length - 1) { nextBtn.href = `post.html?id=${allItems[idx+1].id}&type=${type}`; }
    else { nextBtn.style.opacity = '0.4'; nextBtn.setAttribute('aria-disabled','true'); nextBtn.removeAttribute('href'); }

    document.getElementById('post-loading').style.display = 'none';
    document.getElementById('post-content').style.display = '';
    lucide.createIcons();

  } catch (err) {
    console.error('Post load error:', err);
    showError();
  }
}

async function getAllOfType(type) {
  switch (type) {
    case 'article': return await ArticlesDB.getPublished();
    case 'event':   return await EventsDB.getAll();
    case 'course':  return await CoursesDB.getAll();
    case 'sport':   return await SportsDB.getPublished();
    default: return await ArticlesDB.getPublished();
  }
}

function showError() {
  document.getElementById('post-loading').style.display = 'none';
  document.getElementById('post-error').style.display = '';
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  const type = getParam('type') || 'article';
  renderNavbar({ activePage: (backLinks[type] || 'articles.html') });
  renderFooter();
  loadPost();
});
