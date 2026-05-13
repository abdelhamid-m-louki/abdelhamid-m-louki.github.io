// Migration script to transfer data from JSON files to Supabase
// Run this in the browser console after setting up Supabase

async function migrateToSupabase() {
  console.log('Starting migration to Supabase...');

  try {
    // Initialize Supabase
    const supabase = window.supabase.createClient(
      'YOUR_SUPABASE_URL',
      'YOUR_SUPABASE_ANON_KEY'
    );

    // Migrate settings
    console.log('Migrating settings...');
    const settings = await fetch('/data/settings.json').then(r => r.json());
    await supabase.from('settings').upsert({
      site: settings.site,
      contact: settings.contact,
      social: settings.social,
      ai: settings.ai
    });

    // Migrate categories
    console.log('Migrating categories...');
    const categories = await fetch('/data/categories.json').then(r => r.json());
    for (const cat of categories.categories) {
      await supabase.from('categories').upsert({
        id: cat.id,
        name_ar: cat.name_ar,
        name_fr: cat.name_fr,
        slug: cat.slug,
        description_ar: cat.description_ar,
        description_fr: cat.description_fr,
        color: cat.color || '#1b4e5c',
        icon: cat.icon,
        sort_order: cat.sort_order || 0,
        active: cat.active !== false
      });
    }

    // Migrate articles
    console.log('Migrating articles...');
    const articles = await fetch('/data/articles.json').then(r => r.json());
    for (const art of articles.articles) {
      await supabase.from('articles').upsert({
        id: art.id,
        title_ar: art.title_ar,
        title_fr: art.title_fr,
        excerpt_ar: art.excerpt_ar,
        excerpt_fr: art.excerpt_fr,
        content_ar: art.content_ar || art.body_ar,
        content_fr: art.content_fr || art.body_fr,
        body_ar: art.body_ar,
        body_fr: art.body_fr,
        category_id: art.category_id,
        status: art.status || 'draft',
        image: art.image,
        tags: art.tags || [],
        date_published: art.date_published,
        date_created: art.date_created,
        date_updated: art.date_updated,
        views: art.views || 0
      });
    }

    // Migrate events
    console.log('Migrating events...');
    const events = await fetch('/data/events.json').then(r => r.json());
    for (const evt of events.events) {
      await supabase.from('events').upsert({
        id: evt.id,
        title_ar: evt.title_ar,
        title_fr: evt.title_fr,
        excerpt_ar: evt.excerpt_ar,
        excerpt_fr: evt.excerpt_fr,
        content_ar: evt.content_ar || evt.body_ar,
        content_fr: evt.content_fr || evt.body_fr,
        body_ar: evt.body_ar,
        body_fr: evt.body_fr,
        category_id: evt.category_id,
        status: evt.status || 'draft',
        image: evt.image,
        tags: evt.tags || [],
        date_start: evt.date_start,
        date_end: evt.date_end,
        location_ar: evt.location_ar,
        location_fr: evt.location_fr,
        capacity: evt.capacity,
        registration_link: evt.registration_link,
        date_published: evt.date_published,
        date_created: evt.date_created,
        date_updated: evt.date_updated,
        views: evt.views || 0
      });
    }

    // Migrate courses
    console.log('Migrating courses...');
    const courses = await fetch('/data/courses.json').then(r => r.json());
    for (const course of courses.courses) {
      await supabase.from('courses').upsert({
        id: course.id,
        title_ar: course.title_ar,
        title_fr: course.title_fr,
        excerpt_ar: course.excerpt_ar,
        excerpt_fr: course.excerpt_fr,
        content_ar: course.content_ar || course.body_ar,
        content_fr: course.content_fr || course.body_fr,
        body_ar: course.body_ar,
        body_fr: course.body_fr,
        category_id: course.category_id,
        status: course.status || 'draft',
        image: course.image,
        tags: course.tags || [],
        duration: course.duration,
        level: course.level,
        instructor: course.instructor,
        price: course.price,
        date_published: course.date_published,
        date_created: course.date_created,
        date_updated: course.date_updated,
        views: course.views || 0
      });
    }

    // Migrate sports
    console.log('Migrating sports...');
    const sports = await fetch('/data/sports.json').then(r => r.json());
    for (const sport of sports.sports) {
      await supabase.from('sports').upsert({
        id: sport.id,
        title_ar: sport.title_ar,
        title_fr: sport.title_fr,
        excerpt_ar: sport.excerpt_ar,
        excerpt_fr: sport.excerpt_fr,
        content_ar: sport.content_ar || sport.body_ar,
        content_fr: sport.content_fr || sport.body_fr,
        body_ar: sport.body_ar,
        body_fr: sport.body_fr,
        category_id: sport.category_id,
        status: sport.status || 'draft',
        image: sport.image,
        tags: sport.tags || [],
        sport_type: sport.sport_type,
        age_group: sport.age_group,
        date_published: sport.date_published,
        date_created: sport.date_created,
        date_updated: sport.date_updated,
        views: sport.views || 0
      });
    }

    // Migrate contacts
    console.log('Migrating contacts...');
    const contacts = await fetch('/data/contacts.json').then(r => r.json());
    for (const contact of contacts.contacts) {
      await supabase.from('contacts').upsert({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        read: contact.read || false,
        replied: contact.replied || false,
        date_created: contact.date
      });
    }

    // Migrate memberships
    console.log('Migrating memberships...');
    const memberships = await fetch('/data/memberships.json').then(r => r.json());
    for (const membership of memberships.memberships) {
      await supabase.from('memberships').upsert({
        id: membership.id,
        first_name: membership.first_name,
        last_name: membership.last_name,
        email: membership.email,
        phone: membership.phone,
        birth_date: membership.birth_date,
        education_level: membership.education_level,
        interests: membership.interests || [],
        motivation: membership.motivation,
        status: membership.status || 'pending',
        reference: membership.reference,
        date_created: membership.date
      });
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateToSupabase();