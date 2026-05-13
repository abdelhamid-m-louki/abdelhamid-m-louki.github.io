// === SUPABASE MIGRATION SCRIPT ===
// Exécutez ces commandes une par une dans la console du navigateur

// 1. D'abord, initialisez Supabase (remplacez par vos vraies clés)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Fonction utilitaire pour migrer une table
async function migrateTable(tableName, dataArray, transformFn = null) {
  console.log(`Migrating ${tableName}... (${dataArray.length} items)`);

  for (let i = 0; i < dataArray.length; i++) {
    const item = transformFn ? transformFn(dataArray[i]) : dataArray[i];

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(item);

      if (error) {
        console.error(`Error migrating ${tableName} item ${i}:`, error);
      } else {
        console.log(`✓ ${tableName} item ${i + 1}/${dataArray.length}`);
      }
    } catch (err) {
      console.error(`Failed to migrate ${tableName} item ${i}:`, err);
    }
  }

  console.log(`${tableName} migration completed!`);
}

// 3. Fonction principale de migration
async function startMigration() {
  try {
    console.log('Starting migration to Supabase...');

    // Settings
    console.log('Fetching settings...');
    const settings = await fetch('data/settings.json').then(r => r.json());
    await migrateTable('settings', [settings]);

    // Categories
    console.log('Fetching categories...');
    const categories = await fetch('data/categories.json').then(r => r.json());
    await migrateTable('categories', categories.categories);

    // Articles
    console.log('Fetching articles...');
    const articles = await fetch('data/articles.json').then(r => r.json());
    await migrateTable('articles', articles.articles, (item) => ({
      ...item,
      content_ar: item.content_ar || item.body_ar,
      content_fr: item.content_fr || item.body_fr,
      body_ar: item.body_ar,
      body_fr: item.body_fr
    }));

    // Events
    console.log('Fetching events...');
    const events = await fetch('data/events.json').then(r => r.json());
    await migrateTable('events', events.events, (item) => ({
      ...item,
      content_ar: item.content_ar || item.body_ar,
      content_fr: item.content_fr || item.body_fr,
      body_ar: item.body_ar,
      body_fr: item.body_fr
    }));

    // Courses
    console.log('Fetching courses...');
    const courses = await fetch('data/courses.json').then(r => r.json());
    await migrateTable('courses', courses.courses, (item) => ({
      ...item,
      content_ar: item.content_ar || item.body_ar,
      content_fr: item.content_fr || item.body_fr,
      body_ar: item.body_ar,
      body_fr: item.body_fr
    }));

    // Sports
    console.log('Fetching sports...');
    const sports = await fetch('data/sports.json').then(r => r.json());
    await migrateTable('sports', sports.sports, (item) => ({
      ...item,
      content_ar: item.content_ar || item.body_ar,
      content_fr: item.content_fr || item.body_fr,
      body_ar: item.body_ar,
      body_fr: item.body_fr
    }));

    // Contacts
    console.log('Fetching contacts...');
    const contacts = await fetch('data/contacts.json').then(r => r.json());
    await migrateTable('contacts', contacts.contacts, (item) => ({
      ...item,
      date_created: item.date
    }));

    // Memberships
    console.log('Fetching memberships...');
    const memberships = await fetch('data/memberships.json').then(r => r.json());
    await migrateTable('memberships', memberships.memberships, (item) => ({
      ...item,
      date_created: item.date
    }));

    console.log('Migration completed successfully! 🎉');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// 4. Lancez la migration
// startMigration();