'use strict';

// === GLOBAL APP STATE ===
const App = {
  lang: localStorage.getItem('sanabil_lang') || 'ar',
  settings: null,

  init() {
    this.loadSettings();
    this.applyLang();
    this.initScrollEffects();
    this.initAnimateOnScroll();
    lucide.createIcons();
  },

  async loadSettings() {
    try {
      if (typeof SettingsDB !== 'undefined') {
        this.settings = await SettingsDB.get();
      } else {
        const data = await DataStore.get('settings');
        this.settings = data;
      }
    } catch (e) {
      console.warn('Could not load settings', e);
    }
  },

  applyLang() {
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-fr', this.lang === 'fr');
    this.updateLangContent();
  },

  toggleLang() {
    this.lang = this.lang === 'ar' ? 'fr' : 'ar';
    localStorage.setItem('sanabil_lang', this.lang);
    this.applyLang();
    lucide.createIcons();
  },

  updateLangContent() {
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.style.display = el.dataset.lang === this.lang ? '' : 'none';
    });
    document.querySelectorAll('[data-ar]').forEach(el => {
      el.textContent = this.lang === 'ar' ? el.dataset.ar : (el.dataset.fr || el.dataset.ar);
    });
  },

  initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  initAnimateOnScroll() {
    const els = document.querySelectorAll('.animate-on-scroll');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
  }
};

// === HELPERS ===
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function formatDate(isoStr, lang = App.lang) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(isoStr, lang = App.lang) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'short', day: 'numeric' });
}

function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function formatNumber(n, lang = App.lang) {
  return lang === 'ar' ? toArabicNumerals(n) : String(n);
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function highlightText(text, query) {
  if (!query) return sanitize(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return sanitize(text).replace(re, '<mark style="background:var(--gold-muted);color:var(--gold)">$1</mark>');
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link, .nav-drawer-link').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    a.classList.toggle('active', href === path);
  });
}

// === COUNTER ANIMATION ===
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = (el.dataset.prefix || '') + formatNumber(current) + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const els = $$('[data-counter]');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, parseInt(e.target.dataset.counter));
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

// === URL ROUTING ===
function buildPostUrl(id, type) {
  return `post.html?id=${id}&type=${type}`;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  setActiveNavLink();
  initCounters();
});
