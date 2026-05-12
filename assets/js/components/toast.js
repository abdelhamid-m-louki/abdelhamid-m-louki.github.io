'use strict';

// === TOAST SYSTEM ===
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      this._container.setAttribute('role', 'status');
      this._container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'success', duration = 4000) {
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const titles = { success: 'تم بنجاح', error: 'حدث خطأ', warning: 'تنبيه', info: 'معلومة' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}" class="toast-icon" aria-hidden="true"></i>
      <div class="toast-body">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" aria-label="إغلاق">
        <i data-lucide="x" style="width:16px;height:16px" aria-hidden="true"></i>
      </button>
    `;

    const container = this._getContainer();
    container.appendChild(toast);
    lucide.createIcons();

    toast.querySelector('.toast-close')?.addEventListener('click', () => this._remove(toast));

    if (duration > 0) setTimeout(() => this._remove(toast), duration);
    return toast;
  },

  _remove(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  },

  success(msg, duration) { return this.show(msg, 'success', duration); },
  error(msg, duration)   { return this.show(msg, 'error', duration); },
  warning(msg, duration) { return this.show(msg, 'warning', duration); },
  info(msg, duration)    { return this.show(msg, 'info', duration); }
};
