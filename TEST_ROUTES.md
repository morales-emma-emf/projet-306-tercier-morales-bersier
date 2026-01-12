# Tableau de Test des Routes API

## Informations Générales
- Base URL: `http://localhost:3000/api`
- Authentification: Session nécessaire pour certaines routes (requête avec cookies)
- Date de création: 2026-01-12

---

## Routes d'Authentification

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 1 | POST | `/auth/login` | Connexion utilisateur | Non | `email`, `password` | ❌ |
| 2 | POST | `/auth/logout` | Déconnexion | Oui | - | ❌ |
| 3 | GET | `/auth/me` | Récupérer l'utilisateur connecté | Oui | - | ❌ |

---

## Routes Admin - Utilisateurs

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 4 | GET | `/admin/users` | Lister tous les utilisateurs | Admin | `id` (optionnel) | ❌ |
| 5 | POST | `/admin/users` | Créer/modifier un utilisateur | Admin | `pk_utilisateur`, `email`, `prenom`, `nom`, `fk_role`, `password`, etc. | ❌ |
| 6 | DELETE | `/admin/users` | Supprimer un utilisateur | Admin | `pk_utilisateur` | ❌ |
| 7 | GET | `/admin/users/porte` | Lister les accès utilisateur-porte | Admin | `userid`, `porteid` (optionnels) | ❌ |
| 8 | POST | `/admin/users/porte` | Assigner une porte à un utilisateur | Admin | `fk_utilisateur`, `fk_porte` | ❌ |
| 9 | DELETE | `/admin/users/porte` | Retirer accès porte utilisateur | Admin | `fk_utilisateur`, `fk_porte` | ❌ |

---

## Routes Admin - Portes

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 10 | GET | `/admin/portes` | Lister toutes les portes | Admin | `id` (optionnel) | ❌ |
| 11 | POST | `/admin/portes` | Créer/modifier une porte | Admin | `pk_porte`, `titre`, `description` | ❌ |
| 12 | DELETE | `/admin/portes` | Supprimer une porte | Admin | `pk_porte` | ❌ |

---

## Routes Admin - Rôles

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 13 | GET | `/admin/roles` | Lister tous les rôles | Admin | `id` (optionnel) | ❌ |
| 14 | POST | `/admin/roles` | Créer un rôle | Admin | `nom_role` | ❌ |
| 15 | DELETE | `/admin/roles` | Supprimer un rôle | Admin | `pk_role` | ❌ |
| 16 | GET | `/admin/roles/porte` | Lister les accès rôle-porte | Admin | `roleid`, `porteid` (optionnels) | ❌ |
| 17 | POST | `/admin/roles/porte` | Assigner une porte à un rôle | Admin | `fk_role`, `fk_porte` | ❌ |
| 18 | DELETE | `/admin/roles/porte` | Retirer accès porte rôle | Admin | `fk_role`, `fk_porte` | ❌ |

---

## Routes Admin - Pointages

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 19 | POST | `/admin/pointage` | Créer/modifier un pointage | Admin | `fk_utilisateur`, `heure_entree`, `heure_sortie` | ❌ |

---

## Routes Admin - Logs

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 20 | GET | `/admin/logs` | Lister tous les logs | Admin | `fk_utilisateur`, `fk_porte`, `event_type`, `date_start`, `date_end`, `limit`, `offset` | ❌ |

---

## Routes Badge Scan - Pointage

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 21 | POST | `/badge-scan/pointage` | Scanner badge pointage (entrée/sortie) | Non | `badgeId`, `readerId` | ❌ |

---

## Routes Badge Scan - Porte

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 22 | POST | `/badge-scan/porte` | Scanner badge porte (accès) | Non | `badgeId`, `readerId` | ❌ |

---

## Routes Presences

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 23 | GET | `/presences` | Lister les présences/pointages | Oui | `userid` (admin), `start_date`, `end_date` | ❌ |

---

## Routes Développement

| N° | Méthode | Route | Description | Authentification | Paramètres | Statut |
|---|---|---|---|---|---|---|
| 24 | GET | `/dev` | Récupérer toutes les données dev | Non | - | ❌ |

---

## Légende

- **N°**: Numéro de la route
- **Méthode**: GET, POST, PUT, DELETE, PATCH
- **Route**: Chemin de la route API
- **Description**: Fonction de la route
- **Authentification**: Si une authentification est nécessaire
  - `Non`: Route publique
  - `Oui`: Authentification requise
  - `Admin`: Authentification Admin requise
- **Paramètres**: Paramètres d'entrée (query string ou body JSON)
- **Statut**: ❌ (À tester), ✅ (Testé avec succès), ⚠️ (Erreurs détectées)

---

## Résumé

- **Total de routes**: 24
- **Routes publiques**: 4 (auth/login, badge-scan/pointage, badge-scan/porte, dev)
- **Routes authentifiées**: 6 (auth/logout, auth/me, presences, ...)
- **Routes Admin**: 14

---

## Notes

- Les routes Admin retournent un statut 403 si l'utilisateur n'est pas admin
- Les routes authentifiées retournent un statut 401 si l'utilisateur n'est pas connecté
- Les timestamps sont au format MySQL: `YYYY-MM-DD HH:mm:ss`
- Les logs enregistrent les actions des utilisateurs et les erreurs
