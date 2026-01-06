#!/bin/bash
set -e # Arrête le script dès qu'une erreur survient

# ==========================================
# Script d'installation automatique Porte Badge (Version PORTE)
# ==========================================

# Mode non-interactif pour apt
export DEBIAN_FRONTEND=noninteractive

# Vérification root
if [ "$EUID" -ne 0 ]; then 
  echo "ERREUR : Veuillez lancer ce script avec sudo."
  exit 1
fi

# Récupération utilisateur réel
REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(getent passwd $REAL_USER | cut -d: -f6)

echo "--- Configuration pour l'utilisateur : $REAL_USER ---"

# ==========================================
# 0. Préparation et nettoyage des verrous APT
# ==========================================
echo "--- 0. Nettoyage des processus APT ---"
# Désactivation temporaire des mises à jour auto qui bloquent l'installation
systemctl stop unattended-upgrades 2>/dev/null || true
# On tue tout processus apt qui pourrait bloquer
pkill -f apt || true
pkill -f unattended-upgr || true
# Suppression des verrous potentiels
rm -f /var/lib/apt/lists/lock
rm -f /var/cache/apt/archives/lock
rm -f /var/lib/dpkg/lock*
dpkg --configure -a

# ==========================================
# 1. Configuration du Wi-Fi (Ubuntu Server)
# ==========================================
echo "--- 1. Configuration du Wi-Fi ---"

if ! command -v nmcli &> /dev/null; then
    apt-get update
    apt-get install -y rfkill iw network-manager
fi

# Configuration Netplan pour utiliser NetworkManager (Crucial pour Server)
NETPLAN_CFG="/etc/netplan/01-network-manager-all.yaml"
if [ ! -f "$NETPLAN_CFG" ]; then
    echo "Configuration de Netplan..."
    cat <<EOF > $NETPLAN_CFG
network:
  version: 2
  renderer: NetworkManager
EOF
    chmod 600 $NETPLAN_CFG
    netplan apply
    sleep 5
fi

# Déblocage et Démarrage
rfkill unblock wifi || true
rfkill unblock all || true
systemctl enable NetworkManager
systemctl start NetworkManager
sleep 5

echo "Connexion au Wi-Fi..."
if nmcli connection show | grep -q "7Links"; then
    echo "Déjà connecté."
else
    nmcli dev wifi connect "7Links" password "#326IsBest#" || echo "Avertissement connexion (déjà actif ?)"
fi

# ==========================================
# 2. Installation des prérequis
# ==========================================
echo "--- 2. Installation des prérequis ---"
apt-get update
apt-get install -y git curl build-essential

if ! command -v node &> /dev/null; then
    echo "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# ==========================================
# 3. Installation Phidgets
# ==========================================
echo "--- 3. Installation Phidgets ---"
if [ ! -f /etc/apt/sources.list.d/phidgets.list ]; then
    curl -fsSL https://www.phidgets.com/downloads/setup_linux | bash -
fi
apt-get install -y libphidget22 phidget22networkserver

systemctl enable phidget22networkserver
systemctl start phidget22networkserver

# ==========================================
# 4. Clonage du projet
# ==========================================
echo "--- 4. Récupération du code ---"
TARGET_DIR="$USER_HOME/projet-306-tercier-morales-bersier"
chown $REAL_USER:$REAL_USER "$USER_HOME" # Sécurité permissions

if [ -d "$TARGET_DIR" ]; then
    echo "Mise à jour du dossier existant..."
    cd "$TARGET_DIR"
    sudo -u $REAL_USER git pull
else
    echo "Clonage du dépôt..."
    sudo -u $REAL_USER git clone https://github.com/morales-emma-emf/projet-306-tercier-morales-bersier.git "$TARGET_DIR"
fi

# ==========================================
# 5. Installation NPM (Module PORTE)
# ==========================================
echo "--- 5. Installation NPM (Porte) ---"
PROJECT_PATH="$TARGET_DIR/code/badge-service/Porte"

if [ ! -d "$PROJECT_PATH" ]; then
    echo "ERREUR : Le dossier $PROJECT_PATH n'existe pas."
    exit 1
fi

cd "$PROJECT_PATH"
sudo -u $REAL_USER npm install

# ==========================================
# 6. Configuration interactives (.env)
# ==========================================
echo "--- 6. Configuration de la porte ---"
echo "----------------------------------------------------"
echo " IMPORTANT : Configuration de l'identifiant "
echo "----------------------------------------------------"

# Boucle pour forcer une saisie non vide
READER_ID=""
while [ -z "$READER_ID" ]; do
    echo -n "Veuillez entrer l'ID de cette porte (ex: porte_entree_1) : "
    read READER_ID < /dev/tty
done

# Création du fichier .env
cat <<EOF > "$PROJECT_PATH/.env"
READER_ID=$READER_ID
SERVER_URL=https://badge-elouan.vercel.app/api/badge-scan/porte
EOF

# Correction des droits (car créé par root)
chown $REAL_USER:$REAL_USER "$PROJECT_PATH/.env"
chmod 600 "$PROJECT_PATH/.env"

echo "Fichier .env configuré pour : $READER_ID"

# ==========================================
# 7. Service Systemd
# ==========================================
echo "--- 7. Création du service ---"
SERVICE_FILE="/etc/systemd/system/porte-service.service"
NODE_BIN=$(which node)

cat <<EOF > $SERVICE_FILE
[Unit]
Description=Service Porte Badge RFID (Porte)
After=network.target network-online.target phidget22networkserver.service
Wants=network-online.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$PROJECT_PATH
ExecStart=$NODE_BIN server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable porte-service.service
systemctl restart porte-service.service

echo "=============================================="
echo "INSTALLATION PORTE TERMINÉE !"
echo "ID Configuré : $READER_ID"
echo "Logs : journalctl -u porte-service -f"
echo "=============================================="