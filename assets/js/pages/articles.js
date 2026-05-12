'use strict';

const ARTICLES_PER_PAGE = 9;
let _allArticles = [];
let _filtered = [];
let _currentPage = 1;
let _currentSort = 'newest';
let _currentCat = 'all';
let _searchQuery = '';

const typeIcons = { article:'file-text', event:'calendar-days', course:'graduation-cap', sport:'dumbbell' };
const typeLabels = { article:{ar:'مقال',fr:'Article'}, event:{ar:'فعالية',fr:'Événement'}, course:{ar:'دورة',fr:'Formation'}, sport:{ar:'رياضة',fr:'Sport'} };

function buildCard(item) {
  const lang = App.lang;
  const title = lang === 'ar' ? item.title_ar : (item.title_fr || item.title_ar);
  const excerpt = lang === 'ar' ? item.excerpt_ar : (item.excerpt_fr || item.excerpt_ar);
  const date = formatDate(item.date_published);
  const type = item.type || 'article';
  const icon = typeIcons[type] || 'file-text';
  const label = typeLabels[type]?.[lang] || '';
  const highlighted = _searchQuery ? highlightText(title, _searchQuery) : sanitize(title);

  return `
    <article class="article-card animate-on-scroll">
      <a href="post.html?id=${item.id}&type=${type}" aria-label="${sanitize(title)}">
        ${item.image
          ? `<img class="article-card-img" src="${item.image}" alt="${sanitize(item.image_alt_ar || title)}" loading="lazy">`
          : `<div class="article-card-img-placeholder" aria-hidden="true"><i data-lucide="${icon}" style="width:48px;height:48px"></i></div>`
        }
      </a>
      <div class="article-card-body">
        <span class="badge badge-gold"><i data-lucide="${icon}" style="width:12px;height:12px" aria-hidden="true"></i> ${label}</span>
        <h2 class="article-card-title">
          <a href="post.html?id=${item.id}&type=${type}" style="color:inherit;text-decoration:none">${highlighted}</a>
        </h2>
        <p class="article-card-excerpt">${sanitize(excerpt)}</p>
        <div class="article-card-footer">
          <span class="article-card-date"><i data-lucide="clock" style="width:13px;height:13px" aria-hidden="true"></i> ${date}</span>
          <a href="post.html?id=${item.id}&type=${type}" style="font-size:13px;font-weight:600;color:var(--primary);display:flex;align-items:center;gap:4px">
            اقرأ المزيد <i data-lucide="arrow-left" style="width:14px;height:14px" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}

function applyFilters() {
  let items = [..._allArticles];
  if (_currentCat !== 'all') items = items.filter(a => a.category_id === _currentCat);
  if (_searchQuery) {
    const q = _searchQuery.toLowerCase();
    items = items.filter(a =>
      (a.title_ar||'').toLowerCase().includes(q) ||
      (a.title_fr||'').toLowerCase().includes(q) ||
      (a.excerpt_ar||'').toLowerCase().includes(q)
    );
  }
  if (_currentSort === 'oldest') items.sort((a, b) => new Date(a.date_published) - new Date(b.date_published));
  else if (_currentSort === 'views') items.sort((a, b) => (b.views || 0) - (a.views || 0));
  else items.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
  _filtered = items;
  _currentPage = 1;
  render();
}

function render() {
  const grid = document.getElementById('articlesGrid');
  if (!grid) return;
  const start = (_currentPage - 1) * ARTICLES_PER_PAGE;
  const page = _filtered.slice(start, start + ARTICLES_PER_PAGE);

  if (!_filtered.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i data-lucide="search-x" class="empty-state-icon"></i>
        <p class="empty-state-title">لا توجد مقالات بهذه المعايير</p>
        <button class="btn btn-secondary" onclick="resetFilters()">إعادة التعيين</button>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    lucide.createIcons();
    return;
  }

  grid.innerHTML = page.map(buildCard).join('');
  renderPagination();
  App.initAnimateOnScroll();
  lucide.createIcons();
}

function renderPagination() {
  const total = Math.ceil(_filtered.length / ARTICLES_PER_PAGE);
  const pg = document.getElementById('pagination');
  if (!pg || total <= 1) { if (pg) pg.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="gotoPage(${_currentPage - 1})" ${_currentPage === 1 ? 'disabled' : ''} aria-label="الصفحة السابقة">
    <i data-lucide="chevron-right" style="width:16px;height:16px"></i>
  </button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - _currentPage) <= 1) {
      html += `<button class="page-btn ${i === _currentPage ? 'active' : ''}" onclick="gotoPage(${i})" aria-label="صفحة ${i}" aria-current="${i === _currentPage ? 'page' : 'false'}">${i}</button>`;
    } else if (Math.abs(i - _currentPage) === 2) {
      html += `<span class="page-btn" aria-hidden="true">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="gotoPage(${_currentPage + 1})" ${_currentPage === total ? 'disabled' : ''} aria-label="الصفحة التالية">
    <i data-lucide="chevron-left" style="width:16px;height:16px"></i>
  </button>`;
  pg.innerHTML = html;
  lucide.createIcons();
}

window.gotoPage = function(n) {
  _currentPage = n;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetFilters = function() {
  _searchQuery = '';
  _currentCat = 'all';
  document.getElementById('articleSearch').value = '';
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
  applyFilters();
};

async function loadSidebar(categories, articles) {
  // Categories sidebar
  const catEl = document.getElementById('sidebarCategories');
  if (catEl) {
    catEl.innerHTML = categories.map(c => `
      <button onclick="filterCat('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:8px 12px;border-radius:var(--radius-xs);background:transparent;border:none;cursor:pointer;color:var(--text-secondary);font-size:14px;transition:all .2s;text-align:right;font-family:inherit"
        class="cat-sidebar-btn" data-cat="${c.id}">
        <span>${sanitize(App.lang === 'ar' ? c.name_ar : c.name_fr)}</span>
        <span class="badge badge-muted">${c.count}</span>
      </button>
    `).join('');
  }

  // Top read
  const topEl = document.getElementById('sidebarTopRead');
  if (topEl) {
    const top5 = [...articles].sort((a, b) => (b.views||0) - (a.views||0)).slice(0, 5);
    topEl.innerHTML = top5.map((a, i) => {
      const title = App.lang === 'ar' ? a.title_ar : (a.title_fr || a.title_ar);
      const colors = ['var(--gold)', 'var(--primary)', 'var(--emerald)', 'var(--warning)', 'var(--primary-light)'];
      return `
        <a href="post.html?id=${a.id}&type=${a.type||'article'}" style="display:flex;align-items:flex-start;gap:var(--space-3);text-decoration:none">
          <span style="font-size:20px;font-weight:800;color:${colors[i]};flex-shrink:0;width:24px;text-align:center">${i + 1}</span>
          <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">${sanitize(title)}</span>
        </a>`;
    }).join('');
  }
}

window.filterCat = function(catId) {
  _currentCat = catId;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === catId));
  applyFilters();
};

async function initArticles() {
  renderNavbar({ activePage: 'articles.html' });
  renderFooter();

  try {
    const [categories, allRaw] = await Promise.all([
      CategoriesDB.getAll(),
      ArticlesDB.getPublished()
    ]);

    _allArticles = allRaw;
    _filtered = allRaw;

    // Build category pills
    const pillsRow = document.getElementById('categoryPills');
    if (pillsRow) {
      categories.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'pill';
        btn.dataset.cat = c.id;
        btn.textContent = App.lang === 'ar' ? c.name_ar : c.name_fr;
        btn.addEventListener('click', () => filterCat(c.id));
        pillsRow.appendChild(btn);
      });
    }

    // Pill click handlers
    document.querySelectorAll('.pill').forEach(p => {
      p.addEventListener('click', () => filterCat(p.dataset.cat));
    });

    // Sort dropdown
    const sortBtn = document.getElementById('sortDropdownBtn');
    const sortMenu = document.getElementById('sortDropdown');
    sortBtn?.addEventListener('click', () => {
      sortMenu?.classList.toggle('open');
      sortBtn.setAttribute('aria-expanded', sortMenu.classList.contains('open').toString());
    });
    document.querySelectorAll('[data-sort]').forEach(item => {
      item.addEventListener('click', () => {
        _currentSort = item.dataset.sort;
        sortMenu?.classList.remove('open');
        sortBtn.querySelector('i:first-child')?.nextSibling;
        const labels = { newest: 'الأحدث', oldest: 'الأقدم', views: 'الأكثر قراءة' };
        if (sortBtn) sortBtn.childNodes[1].textContent = ` ${labels[_currentSort]} `;
        applyFilters();
      });
    });

    // Search
    const searchInput = document.getElementById('articleSearch');
    searchInput?.addEventListener('input', debounce(() => {
      _searchQuery = searchInput.value.trim();
      applyFilters();
    }, 300));

    await loadSidebar(categories, _allArticles);
    applyFilters();

  } catch (err) {
    console.error('Articles load error:', err);
    const grid = document.getElementById('articlesGrid');
    if (grid) grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">تعذّر تحميل المقالات</p>';
  }
}

document.addEventListener('DOMContentLoaded', initArticles);
