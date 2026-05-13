# Migration vers Supabase

Ce guide explique comment migrer votre site web de fichiers JSON locaux vers Supabase pour la gestion de base de données, authentification et stockage.

## 🚀 Étapes de migration

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez l'URL du projet et la clé anonyme

### 2. Configurer la base de données

1. Dans votre projet Supabase, allez dans "SQL Editor"
2. Copiez-collez le contenu du fichier `supabase-schema.sql`
3. Exécutez le script pour créer toutes les tables

### 3. Configurer les clés API

1. Ouvrez le fichier `assets/js/config.js`
2. Remplacez les valeurs par vos vraies clés Supabase :
   ```javascript
   window.SUPABASE_CONFIG = {
     url: 'https://your-project-id.supabase.co',
     anonKey: 'your-anon-key'
   };
   ```

## 🔄 Migration des données - Version Corrigée

### Problèmes résolus :
- ✅ **Colonnes manquantes** : Ajouté `count` à categories, `author` et `image_alt_*` aux autres tables
- ✅ **RLS activé** : Scripts séparés pour gérer la sécurité pendant la migration
- ✅ **Politiques existantes** : Gestion des politiques dupliquées

### Étapes de migration :

1. **Créer le schéma de base de données** :
   ```sql
   -- Dans Supabase SQL Editor, exécutez supabase-schema.sql
   -- (Maintenant gère les politiques existantes automatiquement)
   ```

2. **Préparer la migration** :
   ```sql
   -- Exécutez migration-prep.sql pour désactiver RLS temporairement
   ```

3. **Migrer les données** :
   - Ouvrez `http://localhost:8000/migrate-tool.html`
   - Cliquez sur "Start Migration"
   - Attendez la fin de la migration

4. **Finaliser la migration** :
   ```sql
   -- Après migration, exécutez migration-post.sql pour réactiver RLS
   ```

### Fichiers SQL créés :
- `supabase-schema.sql` : Schéma principal (avec gestion des politiques existantes)
- `migration-prep.sql` : Préparation (désactive RLS)
- `migration-post.sql` : Finalisation (réactive RLS avec politiques publiques)

Si les options ci-dessus ne fonctionnent pas :

1. Ouvrez votre site localement
2. Ouvrez la console du navigateur (F12 → Console)
3. Tapez `allow pasting` et appuyez sur Entrée
4. Exécutez ces commandes une par une :

```javascript
// Initialisation
const supabase = window.supabase.createClient('YOUR_URL', 'YOUR_KEY');

// Migration settings
const settings = await fetch('data/settings.json').then(r => r.json());
await supabase.from('settings').upsert(settings);

// Migration categories
const categories = await fetch('data/categories.json').then(r => r.json());
for (const cat of categories.categories) {
  await supabase.from('categories').upsert(cat);
}

// Et ainsi de suite pour chaque table...
```

### 5. Modifier les pages HTML

Ajoutez ces scripts dans la section `<head>` de chaque page HTML (avant les autres scripts) :

```html
<!-- Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/config.js"></script>
<script src="assets/js/supabase.js"></script>
```

Et remplacez les anciens scripts de données :
```html
<!-- Remplacer -->
<script src="assets/js/data.js"></script>

<!-- Par -->
<!-- Supabase gère maintenant les données -->
```

### 6. Configurer l'authentification

Pour l'authentification admin :

1. Dans Supabase Dashboard > Authentication > Users
2. Créez un utilisateur avec l'email `admin@sanabil.td`
3. Définissez un mot de passe sécurisé
4. Copiez l'UUID de l'utilisateur créé

### 7. Configurer le stockage d'images

1. Dans Supabase Dashboard > Storage
2. Le bucket `images` a été créé automatiquement par le schéma SQL
3. Vous pouvez maintenant uploader des images via l'interface admin

## 📁 Fichiers modifiés

- `assets/js/config.js` - Configuration Supabase
- `assets/js/supabase.js` - Client Supabase et modules de données
- `supabase-schema.sql` - Schéma de base de données
- `migrate-to-supabase.js` - Script de migration des données

## 🔧 Fonctionnalités Supabase

### Base de données
- Tables pour articles, événements, cours, sports, contacts, adhésions
- Sécurité Row Level Security (RLS)
- Index pour les performances

### Authentification
- Authentification des administrateurs
- Sessions sécurisées
- Gestion des rôles (super_admin, moderator, editor)

### Stockage
- Bucket `images` pour le stockage des images
- URLs publiques pour les images
- Upload sécurisé depuis l'admin

## 🛡️ Sécurité

- Row Level Security activé sur toutes les tables
- Politiques d'accès pour utilisateurs authentifiés et public
- Clés API sécurisées côté client

## 📊 Avantages de Supabase

- **Base de données PostgreSQL** : Puissante et scalable
- **Authentification intégrée** : Gestion des utilisateurs simplifiée
- **Stockage d'objets** : Images et fichiers
- **API REST automatique** : Pas besoin de backend personnalisé
- **Temps réel** : Synchronisation en temps réel possible
- **Dashboard** : Interface d'administration web

## 🔄 Rollback

Si vous voulez revenir aux fichiers JSON :
1. Supprimez les scripts Supabase des pages HTML
2. Remettez `assets/js/data.js` comme script de données
3. Les données locales resteront dans localStorage

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Assurez-vous que les clés Supabase sont correctes
3. Vérifiez que le schéma SQL a été exécuté correctement
4. Testez la connexion Supabase dans la console :
   ```javascript
   const { data } = await supabase.from('settings').select('*');
   console.log(data);
   ```