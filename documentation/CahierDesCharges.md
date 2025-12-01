# Cahier des charges : **Nom du projet — Système de badge / Gestion des entrées et heures**

## Réalisé par :
- Noé Bersier
- Elouan Tercier
- Emma Morales

---

## Table des matières
1. [Introduction](#1-introduction)  
2. [Contexte](#2-contexte)  
3. [Objectifs du projet](#3-objectifs-du-projet)  
4. [Livrables](#4-livrables)  
5. [Fonctionnalités](#5-fonctionnalités)  
6. [Exigences non fonctionnelles](#6-exigences-non-fonctionnelles)  
7. [Contraintes du projet](#7-contraintes-du-projet)  
8. [Périmètre du projet](#8-périmètre-du-projet)  
9. [Analyse des risques](#9-analyse-des-risques)  
10. [Ressources nécessaires](#10-ressources-nécessaires)  

---

## 1. Introduction
Le projet consiste à développer un **système de gestion d’accès** et de suivi des **heures des utilisateurs** via un dispositif RFID (ou similaire), couplé à une interface de gestion.  
Le besoin émerge d'une volonté d’automatiser le contrôle des présences, d’améliorer la traçabilité et de simplifier la gestion administrative des heures effectuées.

---

## 2. Contexte
Actuellement, la gestion des entrées/sorties et des heures effectuées dépend de méthodes manuelles ou non centralisées.  
Le projet vise à intégrer une solution composée :
- d’un dispositif physique de lecture (RFID / Phidget),  
- d’un backend permettant de traiter les informations,  
- d’une interface admin et utilisateur,  
- d’un système de retour visuel (vert/rouge) selon la validité du badge.  

Ce besoin est lié à une optimisation organisationnelle et à un meilleur suivi des utilisateurs.

---

## 3. Objectifs du projet
- **O1 – Automatiser** la gestion des entrées via un lecteur RFID/Phidget.  
- **O2 – Permettre aux administrateurs** de gérer les utilisateurs via une interface dédiée.  
- **O3 – Informer visuellement** si un accès est autorisé (LED verte) ou refusé (LED rouge).  
- **O4 – Enregistrer et suivre les heures effectuées**, avec gestion des créneaux, heures minimales, maximales et heures supplémentaires.  
- **O5 – Fournir une interface utilisateur claire (UI/UX)** pour consulter ses informations.  

---

## 4. Livrables
- **Prototype fonctionnel du lecteur RFID/Phidget**  
  → Lecture badge, affichage vert/rouge selon autorisation  
- **Application web (Next.js + Node.js)**  
  → Interface admin + interface utilisateur  
- **Base de données (MySQL)**  
  → Stockage utilisateurs, heures, logs d’entrée  
- **Documentation technique**  
  → Installation, architecture, API, schémas  
- **Rapport final**  
  → Synthèse, résultats, limites, améliorations possibles  

---

## 5. Fonctionnalités

### Fonctionnalités principales
- **Interface de gestion (Admin)** :  
  - CRUD utilisateurs  
  - Suivi des heures  
  - Configuration des créneaux : min, max, heures supplémentaires  
- **Interface utilisateur**  
  - Consultation de ses heures  
  - Indication si son badge est accepté ou refusé  
- **Gestion des accès**  
  - Si l’entrée est valide → LED verte + Phidget valide  
  - Sinon → LED rouge  
- **Enregistrement automatique des entrées/sorties** via RFID  
- **Calcul automatique des heures** selon les règles définies  

---

## 6. Exigences non fonctionnelles
- **Performance :** temps de réponse < 1 seconde  
- **Fiabilité :** fonctionnement stable même en charge  
- **Sécurité :** comptes admin protégés, données sécurisées  
- **Ergonomie :** interface claire et intuitive  
- **Compatibilité :** Phidget, navigateurs modernes  
- **Disponibilité :** environ 99%  

---

## 7. Contraintes du projet
### Techniques
- HTML/CSS  
- Next.js  
- Node.js  
- MySQL  
- Phidget  
- RFID  

### Humaines
- Répartition claire backend / frontend / matériel

### Temporelles
- Travail en sprints  
- Dates limites imposées  

### Financières
- Achat du matériel RFID/Phidget

### Organisationnelles
- Documentation commune  
- Suivi via Kanban ou sprint planning  

---

## 8. Périmètre du projet
### Inclus dans le périmètre :
- Système RFID  
- Interface admin  
- Interface utilisateur  
- Calcul des heures  
- Feedback LED (vert/rouge)  

### Hors périmètre :
- Gestion complète de la paie  
- Intégration avec des systèmes externes  
- Systèmes biométriques  

---

## 9. Analyse des risques

### Matrice des risques

| ID  | Risque                                      | Probabilité | Impact | Criticité | Plan d’atténuation |
|-----|----------------------------------------------|-------------|--------|-----------|---------------------|
| R1  | Retard dans la livraison du prototype RFID   | Moyenne     | Élevé  | Élevée    | Tests matériels anticipés |
| R2  | Problème avec le matériel Phidget/RFID       | Élevée      | Moyen  | Moyenne   | Solution alternative, matériel de secours |
| R3  | Problème de connexion hardware               | Moyenne     | Moyen  | Moyenne   | Debug, protocole clair |
| R4  | Mauvaise interprétation des règles horaires  | Moyenne     | Élevé  | Élevée    | Réunions + validation régulière |
| R5  | Manque de compétences sur Next/Node          | Faible      | Moyen  | Faible    | Documentation, formation |
| R6  | Perte de données non sauvegardées            | Faible      | Élevé  | Moyenne   | Sauvegardes régulières (Git, cloud) |

---

## 10. Ressources nécessaires
### Ressources humaines :
- Développeur backend (Node.js)  
- Développeur frontend (Next.js)  
- Spécialiste matériel (Phidget/RFID)  
- Designer UI/UX  

### Ressources matérielles :
- Lecteur Phidget RFID  
- LED / modules  
- Serveur / hébergement  
- Postes de développement  

### Ressources logicielles :
- Next.js  
- Node.js  
- MySQL  
- GitHub/GitLab  

### Ressources financières :
- Achat matériel RFID/Phidget  
- Éventuels coûts d’hébergement  

---
