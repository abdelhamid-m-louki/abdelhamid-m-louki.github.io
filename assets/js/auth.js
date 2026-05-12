'use strict';

// Simple JWT-like session auth stored in sessionStorage
const Auth = {
  TOKEN_KEY: 'sanabil_admin_token',
  USER_KEY: 'sanabil_admin_user',

  async login(email, password) {
    const data = await DataStore.get('admins');
    const admins = data.admins || [];
    const admin = admins.find(a => a.email === email && a.password_hash === password && a.active);
    if (!admin) throw new Error('INVALID_CREDENTIALS');

    const token = btoa(JSON.stringify({ id: admin.id, email: admin.email, role: admin.role, exp: Date.now() + 8 * 3600 * 1000 }));
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify({ id: admin.id, name: admin.name, email: admin.email, role: admin.role }));
    return admin;
  },

  logout() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    window.location.href = '../admin/login.html';
  },

  isAuthenticated() {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token));
      return payload.exp > Date.now();
    } catch {
      return false;
    }
  },

  getUser() {
    try { return JSON.parse(sessionStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },

  isSuperAdmin() {
    const user = this.getUser();
    return user && user.role === 'super_admin';
  },

  // Call this at the top of every admin page
  requireAuth() {
    if (!this.isAuthenticated()) {
      const current = encodeURIComponent(window.location.href);
      window.location.href = `login.html?redirect=${current}`;
      return false;
    }
    return true;
  },

  // Populate user info in admin UI
  populateUserUI() {
    const user = this.getUser();
    if (!user) return;
    $$('[data-admin-name]').forEach(el => el.textContent = user.name);
    $$('[data-admin-email]').forEach(el => el.textContent = user.email);
    $$('[data-admin-role]').forEach(el => el.textContent = user.role === 'super_admin' ? 'مدير رئيسي' : 'محرر');
    $$('[data-admin-initials]').forEach(el => el.textContent = user.name.charAt(0));

    // Hide super-admin-only elements if not super admin
    if (!this.isSuperAdmin()) {
      $$('[data-super-only]').forEach(el => el.style.display = 'none');
    }

    // Logout buttons
    $$('[data-logout]').forEach(btn => btn.addEventListener('click', () => this.logout()));
  }
};

// Auto-redirect on admin pages
if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('login.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAuth()) return;
    Auth.populateUserUI();
  });
}
