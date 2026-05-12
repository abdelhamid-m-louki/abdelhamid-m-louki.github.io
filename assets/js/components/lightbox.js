'use strict';

// === LIGHTBOX ===
const Lightbox = {
  _el: null,
  _images: [],
  _current: 0,

  _build() {
    if (this._el) return;
    this._el = document.createElement('div');
    this._el.className = 'lightbox';
    this._el.setAttribute('role', 'dialog');
    this._el.setAttribute('aria-modal', 'true');
    this._el.setAttribute('aria-label', 'عرض الصورة');
    this._el.innerHTML = `
      <button class="lightbox-close" aria-label="إغلاق"><i data-lucide="x"></i></button>
      <button class="lightbox-btn lightbox-prev" aria-label="السابق"><i data-lucide="chevron-right"></i></button>
      <img class="lightbox-img" src="" alt="">
      <button class="lightbox-btn lightbox-next" aria-label="التالي"><i data-lucide="chevron-left"></i></button>
      <div class="lightbox-caption"></div>
    `;
    document.body.appendChild(this._el);
    lucide.createIcons();

    this._el.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    this._el.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
    this._el.querySelector('.lightbox-next').addEventListener('click', () => this.next());
    document.addEventListener('keydown', e => {
      if (!this._el.classList.contains('open')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') this.prev();
      if (e.key === 'ArrowLeft') this.next();
    });

    // Touch/swipe
    let startX = 0;
    this._el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    this._el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { dx > 0 ? this.prev() : this.next(); }
    });
  },

  open(images, index = 0) {
    this._build();
    this._images = Array.isArray(images) ? images : [images];
    this._current = index;
    this._show();
    this._el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  _show() {
    const img = this._images[this._current];
    const imgEl = this._el.querySelector('.lightbox-img');
    const caption = this._el.querySelector('.lightbox-caption');
    imgEl.src = typeof img === 'string' ? img : img.src;
    imgEl.alt = typeof img === 'object' ? (img.alt || '') : '';
    caption.textContent = typeof img === 'object' ? (img.caption || '') : '';
    caption.style.display = caption.textContent ? '' : 'none';

    const total = this._images.length;
    this._el.querySelector('.lightbox-prev').style.display = total > 1 ? '' : 'none';
    this._el.querySelector('.lightbox-next').style.display = total > 1 ? '' : 'none';
  },

  prev() { this._current = (this._current - 1 + this._images.length) % this._images.length; this._show(); },
  next() { this._current = (this._current + 1) % this._images.length; this._show(); },

  close() {
    this._el?.classList.remove('open');
    document.body.style.overflow = '';
  },

  // Auto-init gallery grids
  initGallery(container) {
    const imgs = [...container.querySelectorAll('[data-lightbox]')];
    imgs.forEach((img, i) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        this.open(imgs.map(im => ({ src: im.dataset.lightbox || im.src, alt: im.alt, caption: im.dataset.caption || '' })), i);
      });
    });
  }
};
