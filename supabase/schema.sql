-- ============================================================
-- PHASE 5 — Schéma de base de données Supabase
-- Projet : Portfolio Éditorial (https://amlouki.me)
-- À exécuter UNE SEULE FOIS dans : Supabase Dashboard → SQL Editor
-- (script idempotent : CREATE ... IF NOT EXISTS)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Trigger générique : maintient modifie_le automatiquement
-- ------------------------------------------------------------
create or replace function public._maj_modifie_le()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Tables
-- ------------------------------------------------------------

-- Articles de blog (lecture publique = statut 'publié')
create table if not exists public.articles (
  id                text primary key default gen_random_uuid()::text,
  titre             text,
  slug              text,
  extrait           text,
  contenu           text,
  image_couverture  text,
  categorie         text,
  tags              jsonb          default '[]'::jsonb,
  auteur_nom        text,
  auteur_id         text,
  statut            text           default 'brouillon',
  vedette           boolean        default false,
  date_publication  timestamptz,
  temps_lecture     integer,
  nombre_mots       integer,
  vues              integer        default 0,
  meta_description  text,
  meta_titre        text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Projets
create table if not exists public.projets (
  id                text primary key default gen_random_uuid()::text,
  titre             text,
  slug              text,
  description_courte text,
  description       text,
  image             text,
  images_galerie    jsonb          default '[]'::jsonb,
  categorie         text,
  technologies      jsonb          default '[]'::jsonb,
  url_demo          text,
  url_code          text,
  statut            text           default 'brouillon',
  vedette           boolean        default false,
  ordre             integer        default 0,
  annee             integer,
  duree             text,
  role              text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Compétences
create table if not exists public.competences (
  id                text primary key default gen_random_uuid()::text,
  nom               text,
  categorie         text,
  niveau            integer        default 0,
  vedette           boolean        default false,
  ordre             integer        default 0,
  icone             text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Expériences professionnelles
create table if not exists public.experiences (
  id                text primary key default gen_random_uuid()::text,
  titre             text,
  poste             text,
  entreprise        text,
  organisation      text,
  type              text,
  description       text,
  technologies      jsonb          default '[]'::jsonb,
  date_debut        timestamptz,
  date_fin          timestamptz,
  lieu              text,
  remote            boolean        default false,
  ordre             integer        default 0,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Certifications
create table if not exists public.certifications (
  id                text primary key default gen_random_uuid()::text,
  titre             text,
  organisme         text,
  date_obtention    text,
  date_expiration   text,
  url_credential    text,
  statut            text           default 'actif',
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Formations
create table if not exists public.formations (
  id                text primary key default gen_random_uuid()::text,
  titre             text,
  organisation      text,
  type              text,
  specialite        text,
  description       text,
  date_debut        timestamptz,
  date_fin          timestamptz,
  lieu              text,
  diplome           text,
  mention           text,
  ordre             integer        default 0,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Catégories d'articles
create table if not exists public.categories (
  id                text primary key default gen_random_uuid()::text,
  nom               text,
  slug              text,
  description       text,
  couleur           text,
  nombre_articles   integer        default 0,
  ordre             integer        default 0,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Tags
create table if not exists public.tags (
  id                text primary key default gen_random_uuid()::text,
  nom               text,
  slug              text,
  nombre_articles   integer        default 0,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Médiathèque
create table if not exists public.medias (
  id                text primary key default gen_random_uuid()::text,
  nom               text,
  type              text,
  taille            integer,
  url               text,
  chemin            text,
  format            text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Paramètres du site (cle → valeur)
create table if not exists public.parametres (
  id                text primary key default gen_random_uuid()::text,
  cle               text unique not null,
  valeur            text,
  type              text           default 'string',
  description       text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- SEO (cle → valeur, géré par admin/seo.html)
create table if not exists public.seo (
  id                text primary key default gen_random_uuid()::text,
  cle               text unique not null,
  valeur            text,
  type              text           default 'string',
  description       text,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Utilisateurs (profil ; id = id du compte Supabase Auth)
create table if not exists public.utilisateurs (
  id                text primary key default gen_random_uuid()::text,
  email             text unique not null,
  nom               text,
  role              text           default 'editeur'
                     check (role in ('admin','editeur','lecteur')),
  avatar            text,
  actif             boolean        default true,
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Analytiques (événements — table réservée)
create table if not exists public.analytiques (
  id                text primary key default gen_random_uuid()::text,
  page              text,
  type              text,
  valeur            jsonb          default '{}'::jsonb,
  date              timestamptz    default now(),
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- Commentaires (table réservée)
create table if not exists public.commentaires (
  id                text primary key default gen_random_uuid()::text,
  article_id        text,
  nom               text,
  email             text,
  contenu           text,
  statut            text           default 'a_valider',
  cree_le           timestamptz    default now(),
  modifie_le        timestamptz    default now()
);

-- ------------------------------------------------------------
-- 3. Triggers sur les tables avec modifie_le
-- ------------------------------------------------------------
do $$
declare
  nom_table text;
begin
  foreach nom_table in array array[
    'articles','projets','competences','experiences','certifications',
    'formations','categories','tags','medias','parametres','seo',
    'utilisateurs','analytiques','commentaires'
  ] loop
    execute format('drop trigger if exists trg_%s_modifie_le on public.%I', nom_table, nom_table);
    execute format(
      'create trigger trg_%s_modifie_le before update on public.%I for each row execute function public._maj_modifie_le()',
      nom_table, nom_table
    );
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 4. Index utiles
-- ------------------------------------------------------------
create index if not exists idx_articles_slug      on public.articles (slug);
create unique index if not exists uq_articles_slug on public.articles (slug) where slug is not null and slug <> '';
create unique index if not exists uq_projets_slug  on public.projets (slug) where slug is not null and slug <> '';
create unique index if not exists uq_categories_slug on public.categories (slug) where slug is not null and slug <> '';
create unique index if not exists uq_tags_slug     on public.tags (slug) where slug is not null and slug <> '';
create index if not exists idx_articles_statut    on public.articles (statut);
create index if not exists idx_projets_statut     on public.projets (statut);
create index if not exists idx_utilisateurs_email on public.utilisateurs (email);
create index if not exists idx_commentaires_article on public.commentaires (article_id);

-- ------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ------------------------------------------------------------

-- 5a. articles
alter table public.articles enable row level security;
drop policy if exists "articles - lecture publique" on public.articles;
create policy "articles - lecture publique"
  on public.articles for select to anon
  using (statut = 'publié');

-- L'admin (session connectée) voit aussi brouillons et archives
drop policy if exists "articles - lecture connectes" on public.articles;
create policy "articles - lecture connectes"
  on public.articles for select to authenticated
  using (true);

-- 5b. projets
alter table public.projets enable row level security;
drop policy if exists "projets - lecture publique" on public.projets;
create policy "projets - lecture publique"
  on public.projets for select to anon
  using (statut = 'publié');

drop policy if exists "projets - lecture connectes" on public.projets;
create policy "projets - lecture connectes"
  on public.projets for select to authenticated
  using (true);

-- 5c. listes publiques du portfolio
alter table public.competences enable row level security;
drop policy if exists "competences - lecture publique" on public.competences;
create policy "competences - lecture publique" on public.competences for select to anon, authenticated using (true);

alter table public.experiences enable row level security;
drop policy if exists "experiences - lecture publique" on public.experiences;
create policy "experiences - lecture publique" on public.experiences for select to anon, authenticated using (true);

alter table public.certifications enable row level security;
drop policy if exists "certifications - lecture publique" on public.certifications;
create policy "certifications - lecture publique" on public.certifications for select to anon, authenticated using (true);

alter table public.formations enable row level security;
drop policy if exists "formations - lecture publique" on public.formations;
create policy "formations - lecture publique" on public.formations for select to anon, authenticated using (true);

alter table public.categories enable row level security;
drop policy if exists "categories - lecture publique" on public.categories;
create policy "categories - lecture publique" on public.categories for select to anon, authenticated using (true);

alter table public.tags enable row level security;
drop policy if exists "tags - lecture publique" on public.tags;
create policy "tags - lecture publique" on public.tags for select to anon, authenticated using (true);

alter table public.medias enable row level security;
drop policy if exists "medias - lecture publique" on public.medias;
create policy "medias - lecture publique" on public.medias for select to anon, authenticated using (true);

-- 5d. parametres / seo : config publique (aucun secret stocké)
alter table public.parametres enable row level security;
drop policy if exists "parametres - lecture publique" on public.parametres;
create policy "parametres - lecture publique" on public.parametres for select to anon, authenticated using (true);

alter table public.seo enable row level security;
drop policy if exists "seo - lecture publique" on public.seo;
create policy "seo - lecture publique" on public.seo for select to anon, authenticated using (true);

-- 5e. utilisateurs : lecture réservée aux personnes connectées
alter table public.utilisateurs enable row level security;
drop policy if exists "utilisateurs - lecture connectes" on public.utilisateurs;
create policy "utilisateurs - lecture connectes" on public.utilisateurs for select to authenticated using (true);

-- 5f. tables réservées : lecture connectés uniquement
alter table public.analytiques enable row level security;
drop policy if exists "analytiques - lecture connectes" on public.analytiques;
create policy "analytiques - lecture connectes" on public.analytiques for select to authenticated using (true);

alter table public.commentaires enable row level security;
drop policy if exists "commentaires - lecture connectes" on public.commentaires;
create policy "commentaires - lecture connectes" on public.commentaires for select to authenticated using (true);

-- RAPPEL : aucune politique d'écriture pour anon/authenticated.
-- Toutes les écritures passent par l'API Vercel (service_role, contourne RLS).

-- ------------------------------------------------------------
-- 6. Bucket d'images public
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 3145728, array[
  'image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'
])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique des objets du bucket images
drop policy if exists "images - lecture publique" on storage.objects;
create policy "images - lecture publique"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'images');

commit;