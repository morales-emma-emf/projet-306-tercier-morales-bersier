#!/bin/bash

# ==========================================
# Script d'installation automatique Porte Badge
# ==========================================

# Vérification des droits root pour les installations
if [ "$EUID" -ne 0 ]; then 
  echo "Veuillez lancer ce script avec sudo :"
  echo "sudo ./setup_raspi.sh"
  exit
fi

# Récupération de l'utilisateur réel (pas root) pour les fichiers
REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(getent passwd $REAL_USER | cut -d: -f6)

echo "--- Configuration pour l'utilisateur : $REAL_USER ---"

# 1. Connexion au Wi-Fi
echo "--- 1. Configuration du Wi-Fi ---"

# Installation de rfkill et iw pour gérer le blocage (soft block) et la région
if ! command -v rfkill &> /dev/null; then
    apt-get update && apt-get install -y rfkill iw network-manager
fi

echo "Déblocage du Wi-Fi..."
# Définir le code pays (obligatoire sur RPi pour activer le 5GHz et débloquer le Wi-Fi)
echo "Configuration de la région Wi-Fi (CH)..."
iw reg set CH 2>/dev/null || echo "Impossible de définir la région avec iw"

rfkill unblock wifi
rfkill unblock all

echo "Activation de l'interface wlan0..."
ip link set wlan0 up
nmcli radio wifi on

# S'assurer que le service NetworkManager est démarré
systemctl start NetworkManager
sleep 5

echo "Tentative de connexion au SSID : 7links..."
# Essai avec nmcli avec priorité élevée
nmcli dev wifi connect "7Links" password "#326IsBest#"
if [ $? -eq 0 ]; then
    echo "Wi-Fi connecté avec succès."
else
    echo "Attention : La connexion Wi-Fi a échoué ou est déjà active."
fi

# 2. Installation des prérequis système (git, curl, nodejs)
echo "--- 2. Installation des prérequis ---"
apt-get update
apt-get install -y git curl

# Installation de Node.js 20 (Lamesure de sécurité si pas installé)
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js est déjà installé."
fi

# 3. Installation des pilotes Phidgets
echo "--- 3. Installation des pilotes Phidgets ---"
# Configuration du dépôt
curl -fsSL https://www.phidgets.com/downloads/setup_linux | bash -

# Installation libphidget22
apt-get install -y libphidget22

# Installation Server Réseau
apt-get install -y phidget22networkserver

# Vérification service Phidget
systemctl enable phidget22networkserver
systemctl start phidget22networkserver

echo "Pilotes Phidgets installés et service démarré."

# 4. Clonage du projet
echo "--- 4. Récupération du code ---"
TARGET_DIR="$USER_HOME/projet-306-tercier-morales-bersier"

if [ -d "$TARGET_DIR" ]; then
    echo "Le dossier existe déjà. Mise à jour..."
    cd "$TARGET_DIR"
    sudo -u $REAL_USER git pull
else
    echo "Clonage du dépôt..."
    sudo -u $REAL_USER git clone https://github.com/morales-emma-emf/projet-306-tercier-morales-bersier.git "$TARGET_DIR"
fi

# 5. Installation des dépendances (Porte)
echo "--- 5. Installation des modules NPM (Porte) ---"
PROJECT_PATH="$TARGET_DIR/code/badge-service/Porte"
cd "$PROJECT_PATH"

# Installation en tant qu'utilisateur normal pour éviter les problèmes de droits root sur node_modules
sudo -u $REAL_USER npm install

# 6. Configuration de l'environnement (.env)
echo "--- 6. Configuration de la porte ---"
echo "Veuillez entrer l'ID de cette porte (ex: porte_entree_1) :"
read READER_ID < /dev/tty

# Création du fichier .env
cat <<EOF > "$PROJECT_PATH/.env"
READER_ID=$READER_ID
SERVER_URL=https://badge-elouan.vercel.app/api/badge-scan/porte
EOF

# Attribution des droits à l'utilisateur
chown $REAL_USER:$REAL_USER "$PROJECT_PATH/.env"

echo "Fichier .env créé avec READER_ID=$READER_ID"

# 7. Création du service Systemd (Démarrage automatique)
echo "--- 7. Création du service de démarrage automatique ---"
SERVICE_FILE="/etc/systemd/system/porte-service.service"
NODE_PATH=$(which node)

cat <<EOF > $SERVICE_FILE
[Unit]
Description=Service Porte Badge RFID
After=network.target phidget22networkserver.service

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$PROJECT_PATH
ExecStart=$NODE_PATH server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Activation du service
systemctl daemon-reload
systemctl enable porte-service.service
systemctl start porte-service.service

echo "=============================================="
echo "INSTALLATION TERMINÉE !"
echo "Le service tourne en arrière-plan."
echo "Pour voir les logs : journalctl -u porte-service -f"
echo "=============================================="
