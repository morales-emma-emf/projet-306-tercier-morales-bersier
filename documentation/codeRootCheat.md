# codeRootCheat.md

_Feuille de route du code – Projet système de badge_

---

## 0. Objectif du document

Ce fichier sert de **plan rapide** pour savoir :

- où se trouve quoi dans le code,
- comment le **frontend**, le **backend web** et le **badge service** communiquent,
- qui touche à quoi (Emma / Elouan / Noé).

---

## 1. Vue d’ensemble de l’architecture

Architecture logique :

```text
[ Utilisateur (navigateur) ]
            |
            v
[ Next.js (frontend React) ]
            |
            v
[ Next.js API routes (backend web) ]
            |
            v
        [ MySQL ]

[ Badge RFID + LEDs ] -> [ badge-service (Node + Phidget) ] -> HTTP -> [ Next.js API ]
```
