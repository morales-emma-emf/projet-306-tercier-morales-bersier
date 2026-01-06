# Installation des pilotes Phidgets sur Raspberry Pi

Cette procédure décrit les étapes nécessaires pour installer les pilotes et le serveur réseau Phidgets sur une Raspberry Pi (Linux). Ces composants sont requis pour permettre à l'application Node.js de communiquer avec le matériel (lecteur RFID, écran LCD).

## Prérequis
- Une Raspberry Pi sous Linux (ex: Raspberry Pi OS)
- Une connexion Internet
- Droits administrateur (sudo)

## Procédure d'installation

### 1. Configuration du dépôt Phidgets
Téléchargez et installez la clé GPG et le dépôt officiel de Phidgets :
```bash
curl -fsSL https://www.phidgets.com/downloads/setup_linux | bash -
```

### 2. Installation de la bibliothèque C (libphidget22)
Installez la bibliothèque de base nécessaire pour interagir avec les périphériques :
```bash
sudo apt-get install -y libphidget22
```

### 3. Installation du Serveur Réseau (Phidget Network Server)
Le serveur réseau est **indispensable** pour l'utilisation avec Node.js. Il permet d'exposer les périphériques USB via une connexion réseau locale (localhost).
```bash
sudo apt-get install -y phidget22networkserver
```

La définition de règles udev pour l'accès USB est gérée automatiquement par ces paquets.

### 4. Vérification
Assurez-vous que le serveur démarre correctement :
```bash
systemctl status phidget22networkserver
```
Il doit être indiqué comme `active (running)`.

## Note importante pour le développement Node.js
L'application Node.js utilise la connexion réseau (`localhost:5661`) pour parler aux drivers. Assurez-vous que votre code initialise une `NetworkConnection` ou gère la connexion automatique via le serveur.
