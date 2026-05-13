-- Supabase SQL Schema for Sanabil Association Website
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create tables
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site JSONB DEFAULT '{}'::jsonb,
  contact JSONB DEFAULT '{}'::jsonb,
  social JSONB DEFAULT '{}'::jsonb,
  ai JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('super_admin', 'moderator', 'editor')),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  slug TEXT UNIQUE,
  description_ar TEXT,
  description_fr TEXT,
  color TEXT DEFAULT '#1b4e5c',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  excerpt_ar TEXT,
  excerpt_fr TEXT,
  content_ar TEXT,
  content_fr TEXT,
  body_ar TEXT,
  body_fr TEXT,
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  date_published TIMESTAMP WITH TIME ZONE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  author_id UUID REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  excerpt_ar TEXT,
  excerpt_fr TEXT,
  content_ar TEXT,
  content_fr TEXT,
  body_ar TEXT,
  body_fr TEXT,
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  location_ar TEXT,
  location_fr TEXT,
  capacity INTEGER,
  registration_link TEXT,
  date_published TIMESTAMP WITH TIME ZONE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  author_id UUID REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  excerpt_ar TEXT,
  excerpt_fr TEXT,
  content_ar TEXT,
  content_fr TEXT,
  body_ar TEXT,
  body_fr TEXT,
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  duration TEXT,
  level TEXT,
  instructor TEXT,
  price TEXT,
  date_published TIMESTAMP WITH TIME ZONE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  author_id UUID REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  excerpt_ar TEXT,
  excerpt_fr TEXT,
  content_ar TEXT,
  content_fr TEXT,
  body_ar TEXT,
  body_fr TEXT,
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  sport_type TEXT,
  age_group TEXT,
  date_published TIMESTAMP WITH TIME ZONE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  author_id UUID REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  education_level TEXT,
  interests TEXT[],
  motivation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reference TEXT UNIQUE,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES admins(id)
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(date_published);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_sports_status ON sports(status);
CREATE INDEX IF NOT EXISTS idx_sports_category ON sports(category_id);
CREATE INDEX IF NOT EXISTS idx_contacts_read ON contacts(read);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Allow authenticated users to read settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage admins" ON admins
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage articles" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage events" ON events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage courses" ON courses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage sports" ON sports
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage contacts" ON contacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage memberships" ON memberships
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access for published content
CREATE POLICY "Allow public to read published articles" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public to read published events" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public to read published courses" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public to read published sports" ON sports
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public to read categories" ON categories
  FOR SELECT USING (active = true);

CREATE POLICY "Allow public to read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public to create contacts" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to create memberships" ON memberships
  FOR INSERT WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public to view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Insert default settings
INSERT INTO settings (site, contact, social, ai) VALUES (
  '{
    "name_ar": "جمعية سنابل للغة العربية",
    "name_fr": "Association Sanabil de la Langue Arabe",
    "slogan_ar": "نبني جسور المستقبل بلغة الضاد",
    "slogan_fr": "Nous bâtissons les ponts du futur avec la langue de Dâd",
    "logo": "assets/images/logo.svg",
    "hero_image": "assets/images/hero/hero-main.jpg",
    "about_ar": "جمعية سنابل للغة العربية جمعية ثقافية تعليمية تأسست عام 2013 في مدينة أبيشي بتشاد، تعمل على نشر اللغة العربية وتعزيز الهوية الثقافية في المنطقة.",
    "about_fr": "L''Association Sanabil de la Langue Arabe est une association culturelle et éducative fondée en 2013 à Abéché au Tchad, œuvrant pour la promotion de la langue arabe et le renforcement de l''identité culturelle dans la région.",
    "founded_year": 2013,
    "members_count": 150,
    "activities_count": 50,
    "events_count": 13,
    "courses_count": 12
  }'::jsonb,
  '{
    "phone": "+235 91 40 41 66",
    "email": "sanabilarabe2022@gmail.com",
    "address_ar": "أبيشي، تشاد",
    "address_fr": "Abéché, Tchad",
    "hours_ar": "الأحد – الخميس: ٠٨:٠٠ – ١٧:٠٠",
    "hours_fr": "Dim – Jeu : 08h00 – 17h00",
    "maps_embed": ""
  }'::jsonb,
  '{
    "facebook": "#",
    "instagram": "#",
    "youtube": "#",
    "twitter": "#"
  }'::jsonb,
  '{
    "gemini_key": "",
    "openai_key": ""
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert default admin (password will be set via Supabase Auth)
INSERT INTO admins (name, email, role) VALUES
('مدير النظام', 'admin@sanabil.td', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name_ar, name_fr, slug, color) VALUES
('الأخبار', 'Actualités', 'news', '#1b4e5c'),
('الفعاليات', 'Événements', 'events', '#d4a017'),
('الدورات', 'Cours', 'courses', '#2c5530'),
('الرياضة', 'Sport', 'sports', '#8b4513')
ON CONFLICT (slug) DO NOTHING;