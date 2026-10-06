-- ============================================================
-- MIGRATION 0001 — id auto + brouillons visibles pour l'admin
-- Projet : Portfolio Éditorial
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- (complète supabase/schema.sql sur la base déjà appliquée)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Valeur par défaut des identifiants (écritures via l'API
--    sans id explicite — les formulaires n'en fournissent plus)
-- ------------------------------------------------------------
alter table public.articles        alter column id set default gen_random_uuid()::text;
alter table public.projets         alter column id set default gen_random_uuid()::text;
alter table public.competences     alter column id set default gen_random_uuid()::text;
alter table public.experiences     alter column id set default gen_random_uuid()::text;
alter table public.certifications  alter column id set default gen_random_uuid()::text;
alter table public.formations      alter column id set default gen_random_uuid()::text;
alter table public.categories      alter column id set default gen_random_uuid()::text;
alter table public.tags            alter column id set default gen_random_uuid()::text;
alter table public.medias          alter column id set default gen_random_uuid()::text;
alter table public.parametres      alter column id set default gen_random_uuid()::text;
alter table public.seo             alter column id set default gen_random_uuid()::text;
alter table public.utilisateurs    alter column id set default gen_random_uuid()::text;
alter table public.analytiques     alter column id set default gen_random_uuid()::text;
alter table public.commentaires    alter column id set default gen_random_uuid()::text;

-- ------------------------------------------------------------
-- 2. RLS : le public ne voit que les contenus publiés ;
--    l'admin (session connectée, JWT) voit aussi brouillons
--    et archives (sinon filtre "brouillon" et modifications
--    des articles non publiés sont impossibles).
-- ------------------------------------------------------------
drop policy if exists "articles - lecture publique" on public.articles;
create policy "articles - lecture publique"
  on public.articles for select to anon
  using (statut = 'publié');

drop policy if exists "articles - lecture connectes" on public.articles;
create policy "articles - lecture connectes"
  on public.articles for select to authenticated
  using (true);

drop policy if exists "projets - lecture publique" on public.projets;
create policy "projets - lecture publique"
  on public.projets for select to anon
  using (statut = 'publié');

drop policy if exists "projets - lecture connectes" on public.projets;
create policy "projets - lecture connectes"
  on public.projets for select to authenticated
  using (true);

commit;

-- ============================================================
-- Vérification rapide (optionnel) :
--   select pg_get_expr(adbin, adrelid)::text as defaut
--   from pg_attrdef where adrelid = 'public.articles'::regclass;
--   → "gen_random_uuid()::text"
-- ============================================================