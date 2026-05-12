'use strict';

// === DATA STORE — JSON file-based via fetch ===
const DataStore = {
  _cache: {},

  async get(resource) {
    if (this._cache[resource]) return this._cache[resource];
    const res = await fetch(`data/${resource}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`DataStore: failed to fetch ${resource}.json`);
    const data = await res.json();
    this._cache[resource] = data;
    return data;
  },

  invalidate(resource) {
    delete this._cache[resource];
  },

  // Simulate write by storing in localStorage (fallback for static hosting)
  save(resource, data) {
    this._cache[resource] = data;
    localStorage.setItem(`sanabil_data_${resource}`, JSON.stringify(data));
  },

  loadLocal(resource) {
    const raw = localStorage.getItem(`sanabil_data_${resource}`);
    if (raw) {
      try { this._cache[resource] = JSON.parse(raw); return this._cache[resource]; }
      catch { return null; }
    }
    return null;
  }
};

// === ARTICLES ===
const ArticlesDB = {
  async getAll() {
    const data = await DataStore.get('articles');
    return data.articles || [];
  },
  async getPublished() {
    const all = await this.getAll();
    return all.filter(a => a.status === 'published').sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find(a => a.id === id) || null;
  },
  async getByCategory(catId) {
    const pub = await this.getPublished();
    return catId === 'all' ? pub : pub.filter(a => a.category_id === catId);
  },
  async search(query) {
    const pub = await this.getPublished();
    const q = query.toLowerCase();
    return pub.filter(a =>
      (a.title_ar || '').toLowerCase().includes(q) ||
      (a.title_fr || '').toLowerCase().includes(q) ||
      (a.excerpt_ar || '').toLowerCase().includes(q)
    );
  },
  async getRecent(n = 6) {
    const pub = await this.getPublished();
    return pub.slice(0, n);
  },
  async getRelated(ids = []) {
    const all = await this.getAll();
    return all.filter(a => ids.includes(a.id) && a.status === 'published');
  }
};

// === EVENTS ===
const EventsDB = {
  async getAll() {
    const data = await DataStore.get('events');
    return data.events || [];
  },
  async getUpcoming() {
    const all = await this.getAll();
    const now = new Date();
    return all.filter(e => new Date(e.date_start) >= now).sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  },
  async getPast() {
    const all = await this.getAll();
    const now = new Date();
    return all.filter(e => new Date(e.date_start) < now).sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find(e => e.id === id) || null;
  },
  async getRecent(n = 4) {
    const upcoming = await this.getUpcoming();
    return upcoming.slice(0, n);
  }
};

// === COURSES ===
const CoursesDB = {
  async getAll() {
    const data = await DataStore.get('courses');
    return data.courses || [];
  },
  async getActive() {
    const all = await this.getAll();
    return all.filter(c => c.status === 'active');
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find(c => c.id === id) || null;
  }
};

// === SPORTS ===
const SportsDB = {
  async getAll() {
    const data = await DataStore.get('sports');
    return data.sports || [];
  },
  async getPublished() {
    const all = await this.getAll();
    return all.filter(s => s.status === 'published');
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find(s => s.id === id) || null;
  }
};

// === BUREAU ===
const BureauDB = {
  async getAll() {
    const data = await DataStore.get('bureau');
    return data.secretariats || [];
  },
  async getAllMembers() {
    const secs = await this.getAll();
    return secs.flatMap(s => s.members || []);
  },
  async getActiveMembers(n) {
    const all = await this.getAllMembers();
    const active = all.filter(m => m.active);
    return n ? active.slice(0, n) : active;
  }
};

// === CATEGORIES ===
const CategoriesDB = {
  async getAll() {
    const data = await DataStore.get('categories');
    return data.categories || [];
  },
  async getById(id) {
    const all = await this.getAll();
    return all.find(c => c.id === id) || null;
  }
};

// === CONTACTS ===
const ContactsDB = {
  async getAll() {
    const local = DataStore.loadLocal('contacts');
    if (local) return local.contacts || [];
    const data = await DataStore.get('contacts');
    return data.contacts || [];
  },
  add(contact) {
    const local = DataStore.loadLocal('contacts') || { contacts: [] };
    contact.id = 'cnt-' + Date.now();
    contact.date = new Date().toISOString();
    contact.read = false;
    contact.replied = false;
    local.contacts.unshift(contact);
    DataStore.save('contacts', local);
    return contact;
  }
};

// === MEMBERSHIPS ===
const MembershipsDB = {
  async getAll() {
    const local = DataStore.loadLocal('memberships');
    if (local) return local.memberships || [];
    const data = await DataStore.get('memberships');
    return data.memberships || [];
  },
  add(membership) {
    const local = DataStore.loadLocal('memberships') || { memberships: [] };
    membership.id = 'mbr-' + Date.now();
    membership.date = new Date().toISOString();
    membership.status = 'pending';
    membership.reference = 'SAN-' + new Date().getFullYear() + '-' + String(local.memberships.length + 1).padStart(3, '0');
    local.memberships.unshift(membership);
    DataStore.save('memberships', local);
    return membership;
  }
};

// === SETTINGS ===
const SettingsDB = {
  async get() {
    return await DataStore.get('settings');
  }
};

// === UNIVERSAL ITEM LOADER (handles all post types) ===
async function getPostById(id, type) {
  switch (type) {
    case 'article': return await ArticlesDB.getById(id);
    case 'event':   return await EventsDB.getById(id);
    case 'course':  return await CoursesDB.getById(id);
    case 'sport':   return await SportsDB.getById(id);
    default:
      // Try all
      return (await ArticlesDB.getById(id)) ||
             (await EventsDB.getById(id)) ||
             (await CoursesDB.getById(id)) ||
             (await SportsDB.getById(id));
  }
}
