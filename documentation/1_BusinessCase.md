# Module 306 : Réaliser un projet informatique  
## Business case 📝

---

# Business case : Système de badge — Gestion des accès et des heures

### Réalisé par :
- MORALES LOUZE Emma
- BERSIER Noé
- TERCIER ELOUAN

---

## Table des matières
1. [Contexte du projet](#1-contexte-du-projet)  
2. [Problématique / Opportunité](#2-problématique--opportunité)  
3. [Objectifs du projet](#3-objectifs-du-projet)  
4. [Bénéfices attendus](#4-bénéfices-attendus)  
5. [Analyse SWOT](#5-analyse-swot)  
6. [Parties prenantes](#6-parties-prenantes)  
7. [Risques principaux](#7-risques-principaux)  
8. [Budget estimé](#8-budget-estimé)  
9. [Critères de succès](#9-critères-de-succès)  
10. [Décision GO / NOGO](#10-décision-go--nogo)  

---

## 1. Contexte du projet
La gestion actuelle des entrées, des sorties et du suivi des heures des utilisateurs repose sur des processus partiellement manuels, dispersés ou non centralisés.  
Cela entraîne un manque de visibilité sur les présences, des erreurs humaines, et une perte de temps pour les responsables et les utilisateurs.

Le projet vise à mettre en place un système automatisé combinant un lecteur RFID, une base de données et une interface web moderne pour centraliser la gestion.

---

## 2. Problématique / Opportunité
### Problématique  
Comment automatiser la gestion des entrées/sorties et du suivi des heures, tout en améliorant la fiabilité et la rapidité du processus ?

### Opportunité  
L’utilisation de technologies modernes (RFID, Phidget, Next.js, Node.js) permet :
- de simplifier la gestion des utilisateurs,
- de sécuriser les accès,
- d’obtenir un suivi précis du temps,
- de réduire le travail administratif.

---

## 3. Objectifs du projet
Objectifs SMART :
- Mettre en place un lecteur RFID fonctionnel pour permettre l’accès automatisé.  
- Permettre à un administrateur de gérer 100 % des utilisateurs via l’interface.  
- Afficher un retour visuel immédiat (LED verte ou rouge).  
- Calculer automatiquement les heures effectuées (min, max, surplus).  
- Livrer un prototype complet dans les délais du module.

---

## 4. Bénéfices attendus
- Gain de temps pour l’administration.  
- Réduction des erreurs d’enregistrement.  
- Sécurisation du contrôle d’accès.  
- Suivi fiable et automatisé des heures.  
- Amélioration de l’expérience utilisateur grâce à une interface claire.  
- Modernisation du processus interne.

---

## 5. Analyse SWOT

![alt text](./images/swot.png)

---


## 6. Parties prenantes
| Partie prenante | Rôle |
|-----------------|------|
| Client / Commanditaire | Définition du besoin, validations |
| Utilisateurs finaux | Badge pour enregistrer les entrées/sorties |
| Administrateurs | Gestion des utilisateurs et contrôle des heures |
| Équipe projet | Développement backend, frontend et matériel |
| Technicien matériel | Installation, câblage, support RFID |

---

## 7. Risques principaux
- Défaillance du matériel RFID/Phidget → prévoir des tests et un matériel de secours  
- Retards potentiels dans le développement → travail en sprints, priorisation  
- Mauvaise compréhension des règles horaires → validations régulières  
- Failles de sécurité ou pertes de données → sauvegardes Git + bonnes pratiques backend  
- Manque de compétences techniques initiales → documentation, répartition selon les forces  

---

## 8. Budget estimé
### Matériel
- Lecteur Phidget RFID : 50–100 CHF  
- Badges RFID : 1–3 CHF / badge  
- LEDs et câblage : 5–10 CHF  

### Temps de travail (estimation)
- Analyse : 5–8 h  
- Backend : 15–20 h  
- Frontend : 15–20 h  
- Intégration matériel : 10–15 h  
- Tests & documentation : 8–12 h  

### Logiciels
- MySQL, Node.js, Next.js → gratuits  

---

## 9. Critères de succès
- Lecteur RFID fonctionnel avec feedback lumineux  
- Application web opérationnelle (admin + utilisateur)  
- Calcul des heures correct et validé  
- Base de données fiable et sécurisée  
- Respect des délais et du cahier des charges  
- Validation finale par le client / commanditaire  

---

## 10. Décision GO / NOGO
### Décision : **GO**

Le projet est réalisable, utile et pertinent.  
Les bénéfices attendus sont importants, les risques identifiés sont maîtrisables, et les technologies prévues répondent parfaitement aux besoins.

---
