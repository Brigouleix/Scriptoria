# Scriptoria — Backend PHP Symfony

> **⚠️ Non connecté** — Ce backend est fourni comme alternative au BaaS Supabase.  
> Il peut être branché sur la même base PostgreSQL sans toucher au frontend.

---

## Stack technique

| Composant | Technologie | Rôle |
|---|---|---|
| Framework | **Symfony 7** | MVC, routing, DI, sécurité |
| ORM | **Doctrine ORM** | Mapping entités ↔ tables PostgreSQL |
| Auth | **LexikJWTBundle** | Tokens JWT (7 jours) |
| BDD | **PostgreSQL 15** | Même instance que Supabase |
| CORS | **NelmioCorsBundle** | Autorise les requêtes depuis Next.js |

---

## Architecture MVC

```
src/
├── Controller/       ← Couche C : reçoit les requêtes HTTP, retourne JSON
│   ├── AuthController.php
│   ├── ProjectController.php
│   ├── PeopleController.php
│   ├── ChapterController.php
│   └── LocationController.php
│
├── Entity/           ← Couche M : modèles de données (mappés avec Doctrine)
│   ├── User.php
│   ├── Project.php
│   ├── SnowflakeStep.php
│   ├── Person.php
│   ├── CharacterLink.php
│   ├── Location.php
│   └── Chapter.php
│
├── Repository/       ← Couche M : requêtes BDD spécialisées
│   ├── UserRepository.php
│   ├── ProjectRepository.php
│   └── ...
│
└── Service/          ← Logique métier (entre Controller et Repository)
    ├── AuthService.php
    ├── ProjectService.php
    └── PeopleService.php
```

---

## Routes API

### Auth
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Connexion → retourne un JWT |
| `GET`  | `/api/auth/me` | Profil de l'utilisateur connecté |

### Projets *(JWT requis)*
| Méthode | Route | Description |
|---|---|---|
| `GET`   | `/api/projects` | Liste des projets |
| `POST`  | `/api/projects` | Créer un projet |
| `GET`   | `/api/projects/{id}` | Détail + étapes Snowflake |
| `PATCH` | `/api/projects/{id}` | Modifier titre, genre, cover |
| `DELETE`| `/api/projects/{id}` | Supprimer |
| `PATCH` | `/api/projects/{id}/steps/{1-4}` | Sauvegarder une étape Snowflake |

### Personnages *(JWT requis)*
| Méthode | Route | Description |
|---|---|---|
| `GET`   | `/api/people` | Liste des personnages + liens |
| `POST`  | `/api/people` | Créer un personnage |
| `PATCH` | `/api/people/{id}` | Modifier |
| `DELETE`| `/api/people/{id}` | Supprimer |
| `POST`  | `/api/people/links` | Créer un lien entre deux personnages |
| `DELETE`| `/api/people/links/{id}` | Supprimer un lien |

### Chapitres *(JWT requis)*
| Méthode | Route | Description |
|---|---|---|
| `GET`   | `/api/projects/{id}/chapters` | Liste des chapitres |
| `POST`  | `/api/projects/{id}/chapters` | Créer un chapitre |
| `PATCH` | `/api/projects/{id}/chapters/{cid}` | Modifier |
| `DELETE`| `/api/projects/{id}/chapters/{cid}` | Supprimer |

### Lieux *(JWT requis)*
| Méthode | Route | Description |
|---|---|---|
| `GET`   | `/api/locations` | Liste des lieux |
| `POST`  | `/api/locations` | Créer un lieu |
| `PATCH` | `/api/locations/{id}` | Modifier |
| `DELETE`| `/api/locations/{id}` | Supprimer |

---

## Installation (quand tu veux le connecter)

```bash
# 1. Installer les dépendances
cd backend
composer install

# 2. Configurer l'environnement
cp .env.example .env
# → Renseigne DATABASE_URL, JWT_PASSPHRASE, etc.

# 3. Générer les clés JWT
mkdir -p config/jwt
openssl genrsa -out config/jwt/private.pem -aes256 4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem

# 4. Lancer les migrations
php bin/console doctrine:migrations:migrate

# 5. Démarrer le serveur
symfony server:start
# → API disponible sur http://localhost:8000
```

---

## Format des réponses

Toutes les réponses suivent le même format :

```json
// Succès
{ "success": true, "data": { ... }, "meta": { "total": 5 } }

// Erreur
{ "success": false, "error": "Message d'erreur" }
```
