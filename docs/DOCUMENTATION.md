# DOCUMENTATION COMPLÈTE
## Portfolio Éditorial — Système CMS Serverless

**Version :** 1.0.0  
**Langue :** Français  
**Architecture :** Serverless, HTML5 + CSS3 + Vanilla JS + Supabase  
**Cible :** Hébergement statique compatible (GitHub Pages, Netlify, Vercel, Supabase Storage)

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#1-vue-densemble)
2. [Architecture du système](#2-architecture)
3. [Structure des fichiers](#3-structure-des-fichiers)
4. [Système de design](#4-système-de-design)
5. [Installation et démarrage](#5-installation)
6. [Configuration Supabase](#6-supabase)
7. [Système de stockage abstrait](#7-stockage)
8. [Moteur de blog](#8-blog)
9. [Interface d'administration](#9-administration)
10. [Système SEO](#10-seo)
11. [Assistant IA](#11-assistant-ia)
12. [Traitement des images](#12-images)
13. [Authentification](#13-authentification)
14. [Accessibilité](#14-accessibilité)
15. [Performance](#15-performance)
16. [Déploiement](#16-déploiement)
17. [Migration future](#17-migration)
18. [Maintenance](#18-maintenance)

---

## 1. VUE D'ENSEMBLE

### Concept

Portfolio Éditorial est un CMS serverless inspiré de l'esthétique des journaux d'avant-garde français : *Le Monde*, *Libération*, *Les Inrockuptibles*. Il fusionne la rigueur typographique de la presse imprimée avec les contraintes techniques du web moderne.

### Principes fondateurs

- **Zéro framework** — HTML5, CSS3 et Vanilla JavaScript ES6+ exclusivement
- **Serverless par nature** — aucun serveur applicatif requis
- **Supabase uniquement** — pas de fallback local, la base est obligatoire
- **Français partout** — UI, code, commentaires, documentation
- **SEO d'abord** — Lighthouse 100 comme objectif constant
- **Accessibilité intégrée** — WCAG 2.1 AA minimum
- **Thème automatique** — `prefers-color-scheme` uniquement, sans toggle

### Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | HTML5, CSS3, Vanilla JS ES6+ (modules ESM) |
| Base de données | Supabase PostgreSQL |
| Stockage fichiers | Supabase Storage |
| Authentification | Supabase Auth |
| Déploiement | GitHub Pages (frontend) + Vercel (API) |
| API backend | `/api/*` — data, ia, contact, vues |

---

## 2. ARCHITECTURE

### Vue d'ensemble

```
Navigateur
    │
    ▼
index.html / blog/index.html / admin/*.html
    │
    ▼
scripts/app.js (orchestrateur principal)
    │
    ├── scripts/storage/storage-manager.js  ← FAÇADE UNIQUE
    │       └── supabase.adapter.js          ← Backend unique (Supabase)
    │
    ├── scripts/auth/auth.js                ← Authentification
    ├── scripts/seo/seo.js                  ← Métadonnées dynamiques
    ├── scripts/blog/blog.js                ← Moteur de blog
    ├── scripts/ai/ia.js                    ← Assistant IA
    └── scripts/utils/upload.js             ← Traitement images
```

### Règle d'or : La façade

**Le frontend ne doit JAMAIS appeler Supabase directement.**  
Toutes les opérations de données passent par `storage-manager.js`.

```javascript
// CORRECT
import stockage from './storage/storage-manager.js';
const { donnees } = await stockage.obtenirTous('articles');

// INTERDIT
import { createClient } from '@supabase/supabase-js';
// ← Ne jamais faire cela dans les pages ou composants
```

### Backend unique

Supabase est le seul backend du site. Au démarrage, `storage-manager.js` :

1. Vérifie que `CONFIG.SUPABASE_URL` et `CONFIG.SUPABASE_ANON_KEY` sont définis (`config.js`) ;
2. Tente la connexion ; toute erreur est **remontée** — aucune bascule locale n'existe.

---

## 3. STRUCTURE DES FICHIERS

```
portfolio-editorial/
│
├── index.html                          # Page d'accueil
├── a-propos.html                       # Page à propos
├── projets.html                        # Portfolio projets
├── contact.html                        # Formulaire de contact
├── mentions-legales.html               # Mentions légales
├── confidentialite.html                # Politique de confidentialité (RGPD)
├── 404.html                            # Page 404
├── sitemap.xml                         # Plan du site SEO
├── robots.txt                          # Directives crawlers
├── manifest.json                       # PWA manifest
│
├── blog/
│   ├── index.html                      # Listing des articles
│   └── article.html                    # Template article unique
│
├── admin/
│   ├── connexion.html                  # Page de connexion
│   ├── tableau-de-bord.html            # Dashboard principal
│   ├── articles.html                   # Gestion articles (CRUD)
│   ├── projets.html                    # Gestion projets (CRUD)
│   ├── competences.html                # Gestion compétences
│   ├── experiences.html                # Gestion expériences
│   ├── formations.html                 # Gestion formations
│   ├── certifications.html             # Gestion certifications
│   ├── medias.html                     # Médiathèque
│   ├── seo.html                        # Configuration SEO
│   ├── utilisateurs.html               # Gestion utilisateurs
│   └── parametres.html                 # Paramètres du site
│
├── styles/
│   ├── tokens/
│   │   ├── variables.css               # Tokens de design (couleurs, espaces...)
│   │   ├── reset.css                   # Réinitialisation CSS
│   │   └── typographie.css             # Système typographique éditorial
│   ├── layouts/
│   │   └── disposition.css             # Grille, conteneurs, mise en page
│   ├── components/
│   │   ├── textures.css                # Effets papier, halftone, collage
│   │   ├── navigation.css              # En-tête, nav, pied de page
│   │   ├── formulaires.css             # Boutons, inputs, formulaires
│   │   └── cartes.css                  # Cards articles, projets, compétences
│   └── pages/
│       ├── accueil.css                 # Styles spécifiques homepage
│       ├── blog.css                    # Styles blog listing + article
│       └── admin.css                   # Interface d'administration
│
├── scripts/
│   ├── app.js                          # Orchestrateur principal
│   ├── site-parametres.js              # Loader public des paramètres (data-contenu)
│   ├── storage/
│   │   ├── interfaces.js               # Contrats d'adaptateur + constantes
│   │   ├── storage-manager.js          # Façade centrale (ENTRÉE UNIQUE)
│   │   └── supabase.adapter.js         # Implémentation Supabase (backend unique)
│   ├── auth/
│   │   └── auth.js                     # Authentification + sessions
│   ├── seo/
│   │   └── seo.js                      # Moteur SEO dynamique
│   ├── blog/
│   │   └── blog.js                     # Moteur de blog public
│   ├── admin/
│   │   └── dashboard.js                # Logique tableau de bord
│   ├── ai/
│   │   └── ia.js                       # Assistant IA multi-fournisseur
│   └── utils/
│       └── upload.js                   # Compression et upload images
│
├── supabase/                           # Backend Supabase
│   ├── schema.sql                      # Schéma + RLS
│   ├── seed.mjs                        # Seed (compte admin + contenu)
│   ├── vider.mjs                       # Purge du contenu (conserve admin/config)
│   ├── migrations/
│   │   └── 0001-id-defaults-rls.sql    # Migration : id gen_random_uuid, RLS
│   └── seed-data/                      # Fichiers JSON source du seed
│       ├── parametres.json             # Config du site (clés)
│       ├── seo.json                    # Métadonnées SEO
│       └── autres tables (articles, projets, …)
│
└── assets/
    ├── images/
    │   └── portrait.png               # Portrait éditorial transparent
    ├── icons/                         # Icônes PWA (96/192/512)
    ├── apple-touch-icon.png           # Icône iOS (180)
    ├── og-accueil.jpg                 # Image Open Graph de l'accueil
    └── og-defaut.jpg                  # Image Open Graph par défaut
```

---

## 4. SYSTÈME DE DESIGN

### Palette éditoriale

| Rôle | Valeur | Usage |
|------|--------|-------|
| Fond principal | `#F5F0E8` | Arrière-plan papier vieilli |
| Encre | `#0A0A0A` | Texte principal, bordures |
| Accent (jaune) | `#C8A840` | Mise en valeur, CTAs |
| Sépia | `#8B7355` | Éléments secondaires |
| Blanc cassé | `#FAF7F0` | Surfaces élevées |

En mode sombre (`prefers-color-scheme: dark`), les valeurs s'inversent automatiquement via les variables CSS.

### Polices

| Rôle | Police | Usage |
|------|--------|-------|
| Display / Titres | Playfair Display | Manchettes, titres de section |
| Corps de texte | EB Garamond | Articles, paragraphes |
| Condensée | Oswald | Navigation, labels, boutons |
| Monospace | Courier Prime | Métadonnées, code, dates |

### Effets éditoriaux

- **Papier déchiré** — `.papier-dechire-haut` / `.papier-dechire-bas`
- **Trame halftone** — `.halftone-overlay` sur les portraits
- **Étiquettes volantes** — `.etiquette-volante` avec rotation
- **Tampons** — `.tampon` avec effet de presse
- **Grain photographique** — animé via SVG filter sur `body::before`

---

## 5. INSTALLATION

### Prérequis

- Un serveur web local (Live Server, Python http.server, etc.)
- Un compte Supabase (optionnel pour le développement)
- Un éditeur de code

### Démarrage rapide (mode local)

```bash
# 1. Cloner ou télécharger le projet
git clone https://github.com/votre-profil/portfolio-editorial.git
cd portfolio-editorial

# 2. Serveur local simple avec Python
python3 -m http.server 8000

# 3. Ouvrir dans le navigateur
# http://localhost:8000
```

Supabase est obligatoire : renseignez les clés dans `config.js`, créez le
compte admin et le contenu via `node supabase/seed.mjs`.

### Configuration

Toute la configuration est centralisée dans `config.js` (`window.CONFIG`).
`scripts/site-parametres.js`, chargé sur toutes les pages publiques, fusionne
ensuite les valeurs de la table `parametres` (édition via
`/admin/parametres.html`) et injecte le contenu dynamique via les attributs
`data-contenu` (titre, bio, email, réseaux, disponibilité, localisation).

```javascript
window.CONFIG = {
  SITE_NOM:          'AM. LOUKI',
  SITE_URL:          'https://amlouki.me',
  AUTEUR_NOM:        'Abdel-hamid M. LOUKI',
  SUPABASE_URL:      'https://xxxxx.supabase.co',     // Requis
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' // Requis
};
```

---

## 6. CONFIGURATION SUPABASE

### Création du projet

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Nouveau projet → noter l'URL et la clé anon
3. Ouvrir l'éditeur SQL et exécuter le schéma ci-dessous

### Schéma SQL

```sql
-- Extension pour la recherche full-text en français
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Table articles
CREATE TABLE articles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  extrait       TEXT,
  contenu       TEXT,
  image_couverture TEXT,
  categorie     TEXT,
  tags          TEXT[] DEFAULT '{}',
  auteur_nom    TEXT,
  auteur_id     UUID,
  statut        TEXT DEFAULT 'brouillon' CHECK (statut IN ('publié','brouillon','archivé','planifié')),
  vedette       BOOLEAN DEFAULT false,
  ordre         INTEGER DEFAULT 0,
  date_publication TIMESTAMPTZ,
  temps_lecture INTEGER,
  nombre_mots   INTEGER,
  vues          INTEGER DEFAULT 0,
  meta_titre    TEXT,
  meta_description TEXT,
  cree_le       TIMESTAMPTZ DEFAULT now(),
  modifie_le    TIMESTAMPTZ DEFAULT now()
);

-- Table projets
CREATE TABLE projets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description_courte TEXT,
  description   TEXT,
  image         TEXT,
  images_galerie TEXT[] DEFAULT '{}',
  categorie     TEXT,
  technologies  TEXT[] DEFAULT '{}',
  url_demo      TEXT,
  url_code      TEXT,
  statut        TEXT DEFAULT 'brouillon',
  vedette       BOOLEAN DEFAULT false,
  ordre         INTEGER DEFAULT 0,
  annee         INTEGER,
  duree         TEXT,
  role          TEXT,
  cree_le       TIMESTAMPTZ DEFAULT now(),
  modifie_le    TIMESTAMPTZ DEFAULT now()
);

-- Table compétences
CREATE TABLE competences (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom           TEXT NOT NULL,
  categorie     TEXT,
  niveau        INTEGER DEFAULT 80 CHECK (niveau BETWEEN 0 AND 100),
  vedette       BOOLEAN DEFAULT false,
  ordre         INTEGER DEFAULT 0,
  icone         TEXT,
  cree_le       TIMESTAMPTZ DEFAULT now()
);

-- Table expériences
CREATE TABLE experiences (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre         TEXT NOT NULL,
  organisation  TEXT,
  type          TEXT DEFAULT 'emploi',
  description   TEXT,
  technologies  TEXT[] DEFAULT '{}',
  date_debut    DATE NOT NULL,
  date_fin      DATE,
  lieu          TEXT,
  remote        BOOLEAN DEFAULT false,
  ordre         INTEGER DEFAULT 0,
  cree_le       TIMESTAMPTZ DEFAULT now()
);

-- Table formations
CREATE TABLE formations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre         TEXT NOT NULL,
  organisation  TEXT,
  specialite    TEXT,
  description   TEXT,
  date_debut    DATE,
  date_fin      DATE,
  lieu          TEXT,
  diplome       TEXT,
  mention       TEXT,
  ordre         INTEGER DEFAULT 0,
  cree_le       TIMESTAMPTZ DEFAULT now()
);

-- Table catégories
CREATE TABLE categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom           TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  couleur       TEXT DEFAULT '#C8A840',
  nombre_articles INTEGER DEFAULT 0,
  ordre         INTEGER DEFAULT 0,
  cree_le       TIMESTAMPTZ DEFAULT now()
);

-- Table tags
CREATE TABLE tags (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom           TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  nombre_articles INTEGER DEFAULT 0,
  cree_le       TIMESTAMPTZ DEFAULT now()
);

-- Table paramètres
CREATE TABLE parametres (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cle           TEXT NOT NULL UNIQUE,
  valeur        TEXT,
  type          TEXT DEFAULT 'string',
  description   TEXT,
  modifie_le    TIMESTAMPTZ DEFAULT now()
);

-- Table utilisateurs (profils)
CREATE TABLE utilisateurs (
  id            UUID REFERENCES auth.users(id) PRIMARY KEY,
  email         TEXT NOT NULL,
  nom           TEXT,
  role          TEXT DEFAULT 'editeur' CHECK (role IN ('admin','editeur','lecteur')),
  avatar        TEXT,
  actif         BOOLEAN DEFAULT true,
  cree_le       TIMESTAMPTZ DEFAULT now(),
  modifie_le    TIMESTAMPTZ DEFAULT now()
);

-- Index pour la performance
CREATE INDEX idx_articles_statut ON articles(statut);
CREATE INDEX idx_articles_date ON articles(date_publication DESC);
CREATE INDEX idx_articles_categorie ON articles(categorie);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_projets_vedette ON projets(vedette, ordre);

-- RLS (Row Level Security)
ALTER TABLE articles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE competences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres    ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs  ENABLE ROW LEVEL SECURITY;

-- Politiques : lecture publique, écriture authentifiée
CREATE POLICY "Lecture publique articles publiés"
  ON articles FOR SELECT
  USING (statut = 'publié');

CREATE POLICY "CRUD articles — utilisateurs authentifiés"
  ON articles FOR ALL
  USING (auth.role() = 'authenticated');

-- Politique similaire pour toutes les autres tables...
CREATE POLICY "Lecture publique projets publiés"
  ON projets FOR SELECT USING (statut = 'publié');
CREATE POLICY "CRUD projets" ON projets FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique compétences" ON competences FOR SELECT USING (true);
CREATE POLICY "CRUD compétences" ON competences FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique catégories" ON categories FOR SELECT USING (true);
CREATE POLICY "CRUD catégories" ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique tags" ON tags FOR SELECT USING (true);
CREATE POLICY "CRUD tags" ON tags FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique paramètres" ON parametres FOR SELECT USING (true);
CREATE POLICY "CRUD paramètres" ON parametres FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique expériences" ON experiences FOR SELECT USING (true);
CREATE POLICY "CRUD expériences" ON experiences FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Lecture publique formations" ON formations FOR SELECT USING (true);
CREATE POLICY "CRUD formations" ON formations FOR ALL USING (auth.role() = 'authenticated');
```

### Création du bucket de stockage

Dans le tableau de bord Supabase > Storage :

1. Créer un bucket `medias` (public)
2. Créer un bucket `avatars` (public)
3. Configurer les politiques :

```sql
-- Lecture publique des médias
CREATE POLICY "Médias publics"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medias');

-- Upload authentifié uniquement
CREATE POLICY "Upload médias authentifié"
  ON storage.objects FOR INSERT
  USING (bucket_id = 'medias' AND auth.role() = 'authenticated');
```

---

## 7. SYSTÈME DE STOCKAGE

### Principe d'abstraction

```
Page HTML
    │
    ▼
storage-manager.js    ← SEUL POINT D'ENTRÉE
    │
    └── supabase.adapter.js   (backend unique, obligatoire)
```

### API complète du gestionnaire

```javascript
import stockage, { COLLECTIONS } from './storage/storage-manager.js';

// Lire tous les articles publiés (paginés)
const { donnees, total, page } = await stockage.obtenirTous(
  COLLECTIONS.ARTICLES,
  {
    filtres:     { statut: 'publié' },
    tri:         'date_publication',
    ordre:       'desc',
    parPage:     9,
    page:        1,
    recherche:   'design',
    champsRecherche: ['titre', 'extrait'],
  }
);

// Lire un article par identifiant
const article = await stockage.obtenirParId(COLLECTIONS.ARTICLES, 'art-001');

// Lire par champ unique (slug)
const article = await stockage.obtenirParChamp(COLLECTIONS.ARTICLES, 'slug', 'mon-article');

// Créer
const nouvel = await stockage.creer(COLLECTIONS.ARTICLES, { titre: '...', statut: 'brouillon' });

// Mettre à jour
const modifie = await stockage.metAJour(COLLECTIONS.ARTICLES, 'art-001', { titre: 'Nouveau titre' });

// Supprimer
await stockage.supprimer(COLLECTIONS.ARTICLES, 'art-001');

// Compter
const nb = await stockage.compter(COLLECTIONS.ARTICLES, { statut: 'publié' });

// Upload image (traitement WebP automatique)
const { url, chemin } = await stockage.uploaderFichier(fichier, 'blog/couverture');
```

### Collections disponibles

```javascript
import { COLLECTIONS } from './storage/interfaces.js';

COLLECTIONS.ARTICLES        // 'articles'
COLLECTIONS.PROJETS         // 'projets'
COLLECTIONS.COMPETENCES     // 'competences'
COLLECTIONS.EXPERIENCES     // 'experiences'
COLLECTIONS.CERTIFICATIONS  // 'certifications'
COLLECTIONS.FORMATIONS      // 'formations'
COLLECTIONS.CATEGORIES      // 'categories'
COLLECTIONS.TAGS            // 'tags'
COLLECTIONS.MEDIAS          // 'medias'
COLLECTIONS.PARAMETRES      // 'parametres'
COLLECTIONS.UTILISATEURS    // 'utilisateurs'
```

---

## 8. MOTEUR DE BLOG

### Pages

| Page | Fichier | Description |
|------|---------|-------------|
| Listing | `blog/index.html` | Articles paginés avec filtres |
| Article | `blog/[slug].html` | Article complet avec TDM |

### Fonctionnalités

- Filtrage par catégorie via URL (`?cat=design`)
- Filtrage par tag via URL (`?tag=css`)
- Recherche en temps réel avec debounce 350ms
- Pagination avec URLs propres
- Table des matières auto-générée (H2/H3)
- Barre de progression de lecture
- Articles connexes (même catégorie)
- SEO dynamique par article

### Ajouter un article

1. Via l'admin (`/admin/articles.html`) — source unique du contenu (base Supabase).

---

## 9. INTERFACE D'ADMINISTRATION

### Accès

URL : `/admin/connexion.html`  
Authentification : Supabase Auth (comptes + table `utilisateurs`, RLS).
Le compte administrateur est créé par `node supabase/seed.mjs`
(variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

**IMPORTANT** : aucune identité codée en dur — seuls les comptes Auth
Supabase (rôle `admin` / `editeur`) sont acceptés.

### Pages d'administration

| Page | URL | Rôle requis |
|------|-----|-------------|
| Tableau de bord | `/admin/tableau-de-bord.html` | Éditeur |
| Articles | `/admin/articles.html` | Éditeur |
| Projets | `/admin/projets.html` | Éditeur |
| Compétences | `/admin/competences.html` | Éditeur |
| Expériences | `/admin/experiences.html` | Éditeur |
| Médiathèque | `/admin/medias.html` | Éditeur |
| SEO | `/admin/seo.html` | Admin |
| Utilisateurs | `/admin/utilisateurs.html` | Admin |
| Paramètres | `/admin/parametres.html` | Admin |

---

## 10. SYSTÈME SEO

### Usage dans les pages

```javascript
import seo from './scripts/seo/seo.js';

seo.configurer({
  titre:            'Titre de la page',
  description:      'Description méta (max 160 caractères)',
  url:              'https://www.exemple.fr/ma-page.html',
  image:            'https://www.exemple.fr/assets/og-image.jpg',
  type:             'article',            // 'website' | 'article' | 'profile'
  datePublication:  '2024-03-15T10:00:00Z',
  tags:             ['design', 'css'],
  auteur:           { nom: 'Prénom Nom', url: 'https://www.exemple.fr' },
  fil: [
    { nom: 'Accueil', url: '/' },
    { nom: 'Blog', url: '/blog/' },
    { nom: 'Titre de l'article' },       // Dernier élément sans URL
  ],
});
```

### Ce que le moteur génère automatiquement

- `<title>` optimisé
- `<meta name="description">`
- Balises Open Graph complètes
- Twitter Cards
- `<link rel="canonical">`
- JSON-LD : WebSite, Article, Person, BreadcrumbList
- `rel="prev"` / `rel="next"` pour la pagination

---

## 11. ASSISTANT IA

### Configuration

L'IA passe par l'API Vercel `POST /api/ia` :
- prompts système **côté serveur**, en liste blanche par action ;
- authentification JWT requise (rôles éditeur / admin), exception : le
  ping public `{"ping": true}` renvoie `{"ok": true}` ;
- fournisseurs : Gemini (`GEMINI_KEY`) et/ou OpenAI (`OPENAI_KEY`).

`scripts/ai/ia.js` envoie le jeton Supabase en en-tête
`Authorization: Bearer …` via `stockage.obtenirJeton()`.

### Usage dans l'admin

```javascript
import ia, { ACTIONS } from './scripts/ai/ia.js';

// Réécriture
const texteAmeliore = await ia.reecrire(texteOriginal);

// Génération de métadonnées SEO
const meta = await ia.genererMeta(contenuArticle);
// → { titre: '...', description: '...', motsClés: [...] }

// Génération de tags
const tags = await ia.genererTags(contenuArticle);
// → ['javascript', 'css', 'design']

// Résumé
const resume = await ia.resumer(longArticle);
```

---

## 12. TRAITEMENT DES IMAGES

### Pipeline automatique

1. Validation du type MIME
2. Chargement dans un `<canvas>` HTML5
3. Redimensionnement intelligent (conserve le ratio)
4. Conversion en WebP
5. Compression progressive jusqu'à 2 Mo max
6. Upload vers Supabase Storage

### Préréglages disponibles

| Preset | Dimensions | Usage |
|--------|-----------|-------|
| `HERO` | 1920×1080 | Image héros |
| `COUVERTURE` | 1200×630 | Article, OG image |
| `VIGNETTE` | 600×400 | Aperçu article |
| `AVATAR` | 400×400 | Photo de profil |
| `PROJET` | 1200×750 | Image projet |

### Usage

```javascript
import upload from './scripts/utils/upload.js';

const { url, chemin, meta } = await upload.traiterEtUploader(fichier, {
  destination: 'blog/couvertures',
  preset:      'COUVERTURE',
  onProgression: (pct) => console.log(`${pct}%`),
  onPrevisualisation: (urlPreview) => { img.src = urlPreview; },
});

console.log(meta.tauxCompression); // Ex: 67 (%)
```

---

## 13. AUTHENTIFICATION

### Flux de connexion

```
Utilisateur → Formulaire connexion
    │
    ▼
auth.seConnecter(email, motDePasse)
    │
    ▼
supabase.auth.signInWithPassword()   (Supabase Auth uniquement)
    │
    ▼
Session stockée (Supabase Auth)
    │
    ▼
Redirection vers /admin/tableau-de-bord.html
```

### Protection des routes

```javascript
import auth, { ROLES } from './scripts/auth/auth.js';

// Dans chaque page admin :
async function init() {
  // Redirige vers /admin/connexion.html si non connecté
  const autorise = await auth.protegerRoute(ROLES.EDITEUR);
  if (!autorise) return;

  // Suite du code...
}
```

---

## 14. ACCESSIBILITÉ

### Standards visés

- WCAG 2.1 niveau AA
- Lighthouse Accessibility 95+

### Fonctionnalités implémentées

- Lien "Aller au contenu" (visible au focus clavier)
- Navigation complète au clavier
- Attributs ARIA appropriés (`aria-label`, `aria-live`, `aria-current`)
- Focus visible pour utilisateurs clavier
- Contrastes conformes (ratio minimum 4.5:1)
- Sémantique HTML5 (landmarks : `main`, `nav`, `aside`, `header`, `footer`)
- Images avec attribut `alt` systématique
- Formulaires avec `label` associé
- États de chargement annoncés (`aria-live="polite"`)
- Réduction de mouvement respectée (`prefers-reduced-motion`)

---

## 15. PERFORMANCE

### Optimisations appliquées

| Technique | Implémentation |
|-----------|---------------|
| Images WebP | Conversion automatique via Canvas |
| Lazy loading | `loading="lazy"` sur toutes les images non-critiques |
| Polices différées | `media="print" onload="this.media='all'"` |
| Chargement parallèle | `Promise.allSettled()` pour les données |
| Squelettes | Placeholders pendant le chargement |
| Animations GPU | `transform` et `opacity` exclusivement |
| `will-change` | Sur les éléments animés |
| CSS critique | Variables et reset chargés en premier |

### Objectifs Lighthouse

| Métrique | Objectif |
|----------|---------|
| Performance | 95+ |
| Accessibilité | 95+ |
| Bonnes pratiques | 100 |
| SEO | 100 |

---

## 16. DÉPLOIEMENT

### Architecture de déploiement

Le site se déploie sur **deux cibles** :

**Frontend — GitHub Pages** (`https://amlouki.me`, dépôt `abdelhamid-m-louki/abdelhamid-m-louki.github.io`)
- Site 100 % statique publié depuis la branche `main` (racine du dépôt).
- Aucune variable d'environnement : les clés publiques Supabase sont dans `config.js`.

**API — Vercel** (`https://abdelhamid-m-loukigithubio.vercel.app`)
- Seul `/api/*` est déployé (`.vercelignore` exclut le reste du repo).
- L'API est le « Backend For Frontend » : CRUD (`api/data/[collection].js`),
  IA (`api/ia.js`), compteur de vues (`api/vues.js`), contact (`api/contact.js`).

Variables d'environnement côté Vercel :
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_KEY`, `OPENAI_KEY`
- `RESEND_API_KEY`, `CONTACT_EMAIL`, `CONTACT_FROM`, `ALLOWED_ORIGINS=https://amlouki.me`

### Option 4 : Hébergement classique (mutualisé)

1. Upload de tous les fichiers via FTP/SFTP
2. Configuration `.htaccess` (Apache) :

```apache
# Redirige les URLs sans .html
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([^\.]+)$ $1.html [NC,L]

# Compression Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Cache statique
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 17. MIGRATION VERS UNE AUTRE BASE DE DONNÉES

L'architecture d'abstraction permet de migrer sans toucher au frontend.

### Vers MySQL / MariaDB

1. Créer `scripts/storage/mysql.adapter.js`
2. Implémenter `InterfaceStockage`
3. Dans `storage-manager.js`, remplacer l'import de `supabase.adapter.js`

```javascript
// Dans storage-manager.js
import { AdaptateurMySQL } from './mysql.adapter.js';
// Remplace : import { AdaptateurSupabase } from './supabase.adapter.js';
```

### Vers MongoDB

Idem — créer `mongodb.adapter.js` avec les mêmes méthodes.

### Vers une API REST personnalisée

```javascript
// api-rest.adapter.js
export class AdaptateurAPIRest extends InterfaceStockage {
  async obtenirTous(collection, options) {
    const reponse = await fetch(`/api/${collection}?${new URLSearchParams(options)}`);
    return reponse.json();
  }
  // ... autres méthodes
}
```

---

## 18. MAINTENANCE

### Mise à jour des données

Tout passe par l'interface d'administration (`/admin/`) : la table `parametres`
est éditée dans `/admin/parametres.html`, le contenu dans les pages CRUD.

### Sauvegarde

Export via le tableau de bord Supabase (Backups) ; les fichiers seed
(`supabase/seed-data/*.json`) restent versionnés avec Git.

### Génération du sitemap

Le sitemap est statique (`sitemap.xml`). Pour le régénérer dynamiquement :

```javascript
import seo from './scripts/seo/seo.js';
import stockage from './scripts/storage/storage-manager.js';

const { donnees: articles } = await stockage.obtenirTous('articles', {
  filtres: { statut: 'publié' }
});

const pages = [
  { url: 'https://www.exemple.fr/', priorite: 1.0, frequence: 'weekly' },
  ...articles.map(a => ({
    url: `https://www.exemple.fr/blog/${a.slug}.html`,
    dateModification: a.modifie_le,
    priorite: 0.8,
    frequence: 'monthly',
  })),
];

const xml = seo.genererSitemap(pages);
// Télécharger ou envoyer au serveur
```

### Checklist de déploiement

- [ ] Remplacer `www.exemple.fr` par le vrai domaine
- [ ] Configurer `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- [ ] Changer les identifiants admin par défaut
- [ ] Uploader le portrait PNG transparent
- [ ] Générer les favicons et icônes PWA
- [ ] Mettre à jour `sitemap.xml` avec les vrais URLs
- [ ] Configurer les variables d'env Vercel (`SUPABASE_*`, `GEMINI_KEY`, `OPENAI_KEY`, `RESEND_API_KEY`…)
- [ ] Tester Lighthouse sur les pages principales
- [ ] Vérifier les Open Graph avec le débogueur Meta
- [ ] Soumettre le sitemap à Google Search Console

---

*Documentation générée pour Portfolio Éditorial v1.0.0*  
*Licence : MIT — Libre d'utilisation avec attribution*
