'use strict';

// === MODAL SYSTEM ===
const Modal = {
  _stack: [],

  open(options = {}) {
    const { title = '', content = '', footer = '', id = 'modal-' + Date.now(), size = '' } = options;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${id}-title`);
    overlay.id = id;

    overlay.innerHTML = `
      <div class="modal-card ${size ? 'modal-' + size : ''}" style="${size === 'lg' ? 'max-width:720px' : ''}">
        <div class="modal-header">
          <h2 class="modal-title" id="${id}-title">${title}</h2>
          <button class="modal-close" aria-label="إغلاق" data-modal-close>
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    lucide.createIcons();

    requestAnimationFrame(() => overlay.classList.add('open'));
    document.body.style.overflow = 'hidden';

    overlay.querySelector('[data-modal-close]')?.addEventListener('click', () => this.close(id));
    overlay.addEventListener('click', e => { if (e.target === overlay) this.close(id); });
    document.addEventListener('keydown', this._escHandler = e => { if (e.key === 'Escape') this.close(id); }, { once: true });

    this._stack.push(id);
    return overlay;
  },

  close(id) {
    const overlay = document.getElementById(id) || document.querySelector('.modal-overlay.open');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.remove();
      this._stack = this._stack.filter(s => s !== id);
      if (!this._stack.length) document.body.style.overflow = '';
    }, 300);
  },

  confirm(options = {}) {
    return new Promise(resolve => {
      const { title = 'تأكيد', message = '', confirmText = 'تأكيد', cancelText = 'إلغاء', danger = false } = options;
      const id = 'confirm-' + Date.now();
      const footer = `
        <button class="btn btn-secondary" data-cancel>${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${confirmText}</button>
      `;
      const content = `
        <div style="text-align:center;padding:var(--space-4) 0">
          ${danger ? `<i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--danger);margin-bottom:var(--space-4)"></i>` : ''}
          <p style="font-size:16px;color:var(--text-secondary);line-height:1.7">${message}</p>
          ${danger ? `<p style="font-size:13px;color:var(--text-muted);margin-top:var(--space-2)">لا يمكن التراجع عن هذه العملية</p>` : ''}
        </div>
      `;
      const overlay = this.open({ id, title, content, footer });
      overlay.querySelector('[data-confirm]')?.addEventListener('click', () => { this.close(id); resolve(true); });
      overlay.querySelector('[data-cancel]')?.addEventListener('click', () => { this.close(id); resolve(false); });
    });
  }
};
