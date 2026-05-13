// === SUPABASE CONFIGURATION ===
let supabaseClient = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase && window.SUPABASE_CONFIG) {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
  }
  return supabaseClient;
}

// === SUPABASE DATABASE OPERATIONS ===
const SupabaseDB = {
  // Initialize connection
  init() {
    return initSupabase();
  },

  // Authentication methods
  async signIn(email, password) {
    const client = initSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const client = initSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const client = initSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user;
  },

  async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
    }
    return user;
  },

  // Generic CRUD operations
  async get(table, filters = {}) {
    const client = initSupabase();
    let query = client.from(table).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(table, id) {
    const client = initSupabase();
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(table, data) {
    const client = initSupabase();
    const { data: result, error } = await client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async update(table, id, data) {
    const client = initSupabase();
    const { data: result, error } = await client
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async delete(table, id) {
    const client = initSupabase();
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Storage operations
  async uploadImage(file, path) {
    const client = initSupabase();
    const { data, error } = await client.storage
      .from('images')
      .upload(path, file);

    if (error) throw error;
    return data;
  },

  async deleteImage(path) {
    const client = initSupabase();
    const { error } = await client.storage
      .from('images')
      .remove([path]);

    if (error) throw error;
  },

  getImageUrl(path) {
    const client = initSupabase();
    const { data } = client.storage
      .from('images')
      .getPublicUrl(path);

    return data.publicUrl;
  }
};

// === SPECIFIC DATABASE MODULES ===
const ArticlesDB = {
  async getAll() {
    const data = await SupabaseDB.get('articles');
    return data.filter(a => a.status === 'published').sort((a, b) =>
      new Date(b.date_published) - new Date(a.date_published)
    );
  },

  async getPublished() {
    return await this.getAll();
  },

  async getById(id) {
    return await SupabaseDB.getById('articles', id);
  },

  async getByCategory(catId) {
    return await SupabaseDB.get('articles', { category_id: catId, status: 'published' });
  },

  async create(article) {
    return await SupabaseDB.create('articles', article);
  },

  async update(id, article) {
    return await SupabaseDB.update('articles', id, article);
  },

  async delete(id) {
    return await SupabaseDB.delete('articles', id);
  }
};

const EventsDB = {
  async getAll() {
    return await SupabaseDB.get('events');
  },

  async getPublished() {
    return await SupabaseDB.get('events', { status: 'published' });
  },

  async getById(id) {
    return await SupabaseDB.getById('events', id);
  },

  async create(event) {
    return await SupabaseDB.create('events', event);
  },

  async update(id, event) {
    return await SupabaseDB.update('events', id, event);
  },

  async delete(id) {
    return await SupabaseDB.delete('events', id);
  }
};

const CoursesDB = {
  async getAll() {
    return await SupabaseDB.get('courses');
  },

  async getPublished() {
    return await SupabaseDB.get('courses', { status: 'published' });
  },

  async getById(id) {
    return await SupabaseDB.getById('courses', id);
  },

  async create(course) {
    return await SupabaseDB.create('courses', course);
  },

  async update(id, course) {
    return await SupabaseDB.update('courses', id, course);
  },

  async delete(id) {
    return await SupabaseDB.delete('courses', id);
  }
};

const SportsDB = {
  async getAll() {
    return await SupabaseDB.get('sports');
  },

  async getPublished() {
    return await SupabaseDB.get('sports', { status: 'published' });
  },

  async getById(id) {
    return await SupabaseDB.getById('sports', id);
  },

  async create(sport) {
    return await SupabaseDB.create('sports', sport);
  },

  async update(id, sport) {
    return await SupabaseDB.update('sports', id, sport);
  },

  async delete(id) {
    return await SupabaseDB.delete('sports', id);
  }
};

const CategoriesDB = {
  async getAll() {
    return await SupabaseDB.get('categories');
  },

  async getById(id) {
    return await SupabaseDB.getById('categories', id);
  },

  async create(category) {
    return await SupabaseDB.create('categories', category);
  },

  async update(id, category) {
    return await SupabaseDB.update('categories', id, category);
  },

  async delete(id) {
    return await SupabaseDB.delete('categories', id);
  }
};

const ContactsDB = {
  async getAll() {
    return await SupabaseDB.get('contacts');
  },

  async create(contact) {
    return await SupabaseDB.create('contacts', contact);
  },

  async update(id, contact) {
    return await SupabaseDB.update('contacts', id, contact);
  },

  async delete(id) {
    return await SupabaseDB.delete('contacts', id);
  }
};

const MembershipsDB = {
  async getAll() {
    return await SupabaseDB.get('memberships');
  },

  async create(membership) {
    return await SupabaseDB.create('memberships', membership);
  },

  async update(id, membership) {
    return await SupabaseDB.update('memberships', id, membership);
  },

  async delete(id) {
    return await SupabaseDB.delete('memberships', id);
  }
};

const SettingsDB = {
  async get() {
    const settings = await SupabaseDB.get('settings');
    return settings[0] || {};
  },

  async update(settings) {
    const existing = await this.get();
    if (existing.id) {
      return await SupabaseDB.update('settings', existing.id, settings);
    } else {
      return await SupabaseDB.create('settings', settings);
    }
  }
};

// Initialize Supabase when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});