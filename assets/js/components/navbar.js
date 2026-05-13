'use strict';

// === NAVBAR COMPONENT ===
function renderNavbar(options = {}) {
  const { basePath = '', activePage = '' } = options;

  const links = [
    { href: 'index.html', icon: 'home', ar: 'الرئيسية', fr: 'Accueil' },
    { href: 'articles.html', icon: 'file-text', ar: 'المقالات', fr: 'Articles' },
    { href: 'events.html', icon: 'calendar-days', ar: 'الفعاليات', fr: 'Événements' },
    { href: 'courses.html', icon: 'graduation-cap', ar: 'الدورات', fr: 'Formations' },
    { href: 'sports.html', icon: 'dumbbell', ar: 'الرياضة', fr: 'Sports' },
    { href: 'bureau.html', icon: 'shield', ar: 'المكتب التنفيذي', fr: 'Bureau' },
    { href: 'about.html', icon: 'info', ar: 'عن الجمعية', fr: 'À Propos' },
    { href: 'contact.html', icon: 'message-square', ar: 'اتصل بنا', fr: 'Contact' },
  ];

  const desktopLinks = links.map(l => {
    const active = activePage === l.href ? 'active' : '';
    const label = App.lang === 'ar' ? l.ar : l.fr;
    return `<a href="${basePath}${l.href}" class="nav-link ${active}" aria-label="${l.ar}">${label}</a>`;
  }).join('');

  const drawerLinks = links.map(l => {
    const active = activePage === l.href ? 'active' : '';
    const label = App.lang === 'ar' ? l.ar : l.fr;
    return `<a href="${basePath}${l.href}" class="nav-drawer-link ${active}">
      <i data-lucide="${l.icon}" aria-hidden="true"></i>
      ${label}
    </a>`;
  }).join('');

  const html = `
    <a href="#main-content" class="skip-link">تخطّ إلى المحتوى الرئيسي</a>
    <nav class="navbar" role="navigation" aria-label="التنقل الرئيسي">
      <div class="navbar-inner">
        <a href="${basePath}index.html" class="navbar-logo" aria-label="جمعية سنابل للغة العربية">
          <div class="navbar-logo-img" aria-hidden="true">س</div>
          <div class="navbar-logo-text">
            <span class="navbar-logo-name">جمعية سنابل</span>
            <span class="navbar-logo-sub">للغة العربية — تشاد</span>
          </div>
        </a>

        <div class="navbar-links" role="list">
          ${desktopLinks}
        </div>

        <div class="navbar-actions">
          <div class="nav-search-expand" id="navSearchExpand" role="search">
            <i data-lucide="search" aria-hidden="true"></i>
            <input type="search" placeholder="ابحث..." aria-label="بحث" id="navSearchInput">
          </div>
          <button class="nav-icon-btn" id="navSearchToggle" aria-label="بحث" title="بحث">
            <i data-lucide="search" aria-hidden="true"></i>
          </button>
          <button class="lang-toggle" id="langToggle" aria-label="تغيير اللغة">
            <i data-lucide="globe" aria-hidden="true" style="width:14px;height:14px"></i>
            <span id="langLabel">${App.lang === 'ar' ? 'FR' : 'AR'}</span>
          </button>
          <a href="${basePath}join.html" class="nav-join-btn" aria-label="انضم إلينا">
            <i data-lucide="user-plus" aria-hidden="true"></i>
            <span>انضم إلينا</span>
          </a>
          <button class="nav-hamburger" id="navHamburger" aria-label="فتح القائمة" aria-expanded="false">
            <i data-lucide="menu" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </nav>

    <div class="nav-drawer-overlay" id="drawerOverlay" aria-hidden="true"></div>
    <aside class="nav-drawer" id="navDrawer" role="dialog" aria-label="القائمة">
      <div class="nav-drawer-header">
        <div class="navbar-logo">
          <div class="navbar-logo-img" aria-hidden="true">س</div>
          <div class="navbar-logo-text">
            <span class="navbar-logo-name">جمعية سنابل</span>
          </div>
        </div>
        <button class="nav-icon-btn" id="drawerClose" aria-label="إغلاق القائمة">
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      </div>
      <nav class="nav-drawer-links" role="list">
        ${drawerLinks}
      </nav>
    </aside>
  `;

  const container = document.getElementById('navbar-container');
  if (container) container.innerHTML = html;

  initNavbarBehavior(basePath);
}

function initNavbarBehavior(basePath = '') {
  lucide.createIcons();

  // Hamburger toggle
  const hamburger = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
    overlay?.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    overlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  // Search toggle
  const searchToggle = document.getElementById('navSearchToggle');
  const searchExpand = document.getElementById('navSearchExpand');
  const searchInput = document.getElementById('navSearchInput');

  searchToggle?.addEventListener('click', () => {
    searchExpand?.classList.toggle('open');
    if (searchExpand?.classList.contains('open')) searchInput?.focus();
  });

  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) window.location.href = `${basePath}search.html?q=${encodeURIComponent(q)}`;
    }
    if (e.key === 'Escape') searchExpand?.classList.remove('open');
  });

  // Language toggle
  const langToggle = document.getElementById('langToggle');
  const langLabel = document.getElementById('langLabel');
  langToggle?.addEventListener('click', () => {
    App.toggleLang();
    if (langLabel) langLabel.textContent = App.lang === 'ar' ? 'FR' : 'AR';
  });
}

// === FOOTER COMPONENT ===
function renderFooter(options = {}) {
  const { basePath = '' } = options;

  const html = `
    <footer class="footer" role="contentinfo">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-name">جمعية سنابل للغة العربية</div>
          <div class="footer-brand-slogan">نبني جسور المستقبل بلغة الضاد<br>Association Sanabil de la Langue Arabe — Tchad</div>
          <div class="social-row">
            <a href="#" class="social-pill" aria-label="فيسبوك"><i data-lucide="facebook" aria-hidden="true"></i></a>
            <a href="#" class="social-pill" aria-label="إنستغرام"><i data-lucide="instagram" aria-hidden="true"></i></a>
            <a href="#" class="social-pill" aria-label="يوتيوب"><i data-lucide="youtube" aria-hidden="true"></i></a>
            <a href="#" class="social-pill" aria-label="تويتر"><i data-lucide="twitter" aria-hidden="true"></i></a>
          </div>
        </div>

        <div>
          <div class="footer-col-title"><i data-lucide="link" aria-hidden="true"></i> روابط سريعة</div>
          <nav class="footer-links" aria-label="روابط سريعة">
            <a href="${basePath}index.html" class="footer-link">الرئيسية</a>
            <a href="${basePath}articles.html" class="footer-link">المقالات</a>
            <a href="${basePath}events.html" class="footer-link">الفعاليات</a>
            <a href="${basePath}courses.html" class="footer-link">الدورات</a>
            <a href="${basePath}sports.html" class="footer-link">الرياضة</a>
            <a href="${basePath}bureau.html" class="footer-link">المكتب التنفيذي</a>
          </nav>
        </div>

        <div>
          <div class="footer-col-title"><i data-lucide="layers" aria-hidden="true"></i> أنشطتنا</div>
          <nav class="footer-links" aria-label="أنشطتنا">
            <a href="${basePath}about.html" class="footer-link">عن الجمعية</a>
            <a href="${basePath}join.html" class="footer-link">انضم إلينا</a>
            <a href="${basePath}contact.html" class="footer-link">اتصل بنا</a>
          </nav>
        </div>

        <div>
          <div class="footer-col-title"><i data-lucide="map-pin" aria-hidden="true"></i> تواصل معنا</div>
          <div class="footer-contact-item">
            <i data-lucide="map-pin" aria-hidden="true"></i>
            <span>أبيشي، تشاد</span>
          </div>
          <div class="footer-contact-item">
            <i data-lucide="phone" aria-hidden="true"></i>
            <a href="tel:+23591404166" style="color:inherit">+235 91 40 41 66</a>
          </div>
          <div class="footer-contact-item">
            <i data-lucide="mail" aria-hidden="true"></i>
            <a href="mailto:sanabilarabe2022@gmail.com" style="color:inherit;word-break:break-all">sanabilarabe2022@gmail.com</a>
          </div>
          <div class="footer-contact-item">
            <i data-lucide="clock" aria-hidden="true"></i>
            <span>الأحد – الخميس: ٠٨:٠٠ – ١٧:٠٠</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>
        <a href="${basePath}admin/dashboard.html" class="footer-admin-link-toClear" aria-hidden="true">© ${new Date().getFullYear()} جمعية سنابل للغة العربية — أبيشي، تشاد. جميع الحقوق محفوظة.</a>
        </p>
      </div>
    </footer>
  `;

  const container = document.getElementById('footer-container');
  if (container) {
    container.innerHTML = html;
    lucide.createIcons();
  }
}
