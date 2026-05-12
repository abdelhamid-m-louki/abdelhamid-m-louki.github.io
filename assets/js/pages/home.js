'use strict';

// home.js — Logique page d'accueil

const typeIcons = {
  article: 'file-text',
  event: 'calendar-days',
  course: 'graduation-cap',
  sport: 'dumbbell'
};
const typeLabels = {
  article: { ar: 'مقال', fr: 'Article' },
  event:   { ar: 'فعالية', fr: 'Événement' },
  course:  { ar: 'دورة', fr: 'Formation' },
  sport:   { ar: 'رياضة', fr: 'Sport' }
};

function buildArticleCard(item) {
  const lang = App.lang;
  const title = lang === 'ar' ? item.title_ar : (item.title_fr || item.title_ar);
  const excerpt = lang === 'ar' ? item.excerpt_ar : (item.excerpt_fr || item.excerpt_ar);
  const date = formatDate(item.date_published);
  const type = item.type || 'article';
  const icon = typeIcons[type] || 'file-text';
  const label = typeLabels[type]?.[lang] || typeLabels['article'][lang];

  return `
    <article class="article-card animate-on-scroll">
      <a href="post.html?id=${item.id}&type=${type}" aria-label="${sanitize(title)}">
        ${item.image
          ? `<img class="article-card-img" src="${item.image}" alt="${sanitize(item.image_alt_ar || title)}" loading="lazy">`
          : `<div class="article-card-img-placeholder" aria-hidden="true"><i data-lucide="${icon}" style="width:48px;height:48px"></i></div>`
        }
      </a>
      <div class="article-card-body">
        <span class="badge badge-gold">
          <i data-lucide="${icon}" style="width:12px;height:12px" aria-hidden="true"></i>
          ${label}
        </span>
        <h3 class="article-card-title">
          <a href="post.html?id=${item.id}&type=${type}" style="color:inherit;text-decoration:none">${sanitize(title)}</a>
        </h3>
        <p class="article-card-excerpt">${sanitize(excerpt)}</p>
        <div class="article-card-footer">
          <span class="article-card-date">
            <i data-lucide="clock" style="width:13px;height:13px" aria-hidden="true"></i>
            ${date}
          </span>
          <a href="post.html?id=${item.id}&type=${type}" class="flex items-center gap-2" style="font-size:13px;font-weight:600;color:var(--primary)">
            اقرأ المزيد
            <i data-lucide="arrow-left" style="width:14px;height:14px" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}

function buildEventCard(evt) {
  const lang = App.lang;
  const title = lang === 'ar' ? evt.title_ar : (evt.title_fr || evt.title_ar);
  const location = lang === 'ar' ? evt.location_ar : (evt.location_fr || evt.location_ar);
  const d = new Date(evt.date_start);
  const day = d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric' });
  const month = d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long' });
  const isUpcoming = new Date(evt.date_start) >= new Date();

  return `
    <div class="event-card animate-on-scroll">
      <div class="event-date-block" aria-label="التاريخ">
        <div class="event-date-day">${day}</div>
        <div class="event-date-month">${month}</div>
      </div>
      <div class="event-info">
        <div class="event-title">${sanitize(title)}</div>
        <div class="event-meta">
          ${location ? `<div class="event-meta-row"><i data-lucide="map-pin" aria-hidden="true"></i>${sanitize(location)}</div>` : ''}
          ${evt.capacity ? `<div class="event-meta-row"><i data-lucide="users" aria-hidden="true"></i>${formatNumber(evt.capacity)} مقعداً</div>` : ''}
        </div>
        <div style="margin-top:var(--space-3);display:flex;align-items:center;gap:var(--space-3)">
          <span class="badge ${isUpcoming ? 'badge-success' : 'badge-muted'}">${isUpcoming ? 'قريباً' : 'منتهي'}</span>
          <a href="post.html?id=${evt.id}&type=event" class="flex items-center gap-1" style="font-size:13px;font-weight:600;color:var(--primary)">
            التفاصيل <i data-lucide="arrow-left" style="width:13px;height:13px" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildMemberCard(member) {
  const lang = App.lang;
  const name = lang === 'ar' ? member.name_ar : (member.name_fr || member.name_ar);
  const role = lang === 'ar' ? member.role_ar : (member.role_fr || member.role_ar);
  const initials = member.name_ar.split(' ').map(w => w[0]).slice(0, 2).join('');

  return `
    <div class="member-card animate-on-scroll">
      ${member.photo
        ? `<img class="member-avatar" src="${member.photo}" alt="${sanitize(name)}" loading="lazy">`
        : `<div class="member-avatar-placeholder" aria-label="${sanitize(name)}">${initials}</div>`
      }
      <div class="member-name">${sanitize(name)}</div>
      <div class="member-role">${sanitize(role)}</div>
    </div>
  `;
}

async function loadHomePage() {
  // Articles
  const articlesGrid = document.getElementById('articles-grid');
  try {
    const articles = await ArticlesDB.getRecent(6);
    if (articlesGrid) {
      articlesGrid.innerHTML = articles.length
        ? articles.map(buildArticleCard).join('')
        : `<div class="empty-state" style="grid-column:1/-1">
            <i data-lucide="newspaper" class="empty-state-icon"></i>
            <p class="empty-state-title">لا توجد مقالات بعد</p>
          </div>`;
      App.initAnimateOnScroll();
      lucide.createIcons();
    }
  } catch {
    if (articlesGrid) articlesGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">تعذّر تحميل المقالات</p>';
  }

  // Events
  const eventsGrid = document.getElementById('events-grid');
  try {
    const events = await EventsDB.getRecent(4);
    if (eventsGrid) {
      eventsGrid.innerHTML = events.length
        ? events.map(buildEventCard).join('')
        : `<div class="empty-state" style="grid-column:1/-1">
            <i data-lucide="calendar-x" class="empty-state-icon"></i>
            <p class="empty-state-title">لا توجد فعاليات قادمة</p>
          </div>`;
      lucide.createIcons();
    }
  } catch {
    if (eventsGrid) eventsGrid.innerHTML = '';
  }

  // Bureau
  const bureauGrid = document.getElementById('bureau-grid');
  try {
    const members = await BureauDB.getActiveMembers(4);
    if (bureauGrid) {
      bureauGrid.innerHTML = members.length
        ? members.map(buildMemberCard).join('')
        : '';
      lucide.createIcons();
    }
  } catch {
    if (bureauGrid) bureauGrid.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar({ activePage: 'index.html' });
  renderFooter();
  loadHomePage();
});
