#!/bin/bash
set -e # Arrête le script immédiatement si une commande échoue

# ==========================================
# Script d'installation automatique Porte Badge
# ==========================================

# Éviter les pop-ups interactifs lors des apt-get install
export DEBIAN_FRONTEND=noninteractive

# Vérification des droits root
if [ "$EUID" -ne 0 ]; then 
  echo "ERREUR : Veuillez lancer ce script avec sudo."
  exit 1
fi

# Récupération de l'utilisateur réel
REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(getent passwd $REAL_USER | cut -d: -f6)

echo "--- Configuration pour l'utilisateur : $REAL_USER ($USER_HOME) ---"
# ==========================================
# 0. Préparation et nettoyage des verrous APT
# ==========================================
echo "--- 0. Vérification des processus apt en cours ---"

# Fonction pour attendre la libération du verrou
wait_for_apt_lock() {
    while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/dpkg/lock >/dev/null 2>&1; do
        echo "APT est verrouillé par un autre processus. Attente..."
        sleep 5
    done
}

# On essaie d'abord d'arrêter proprement les mises à jour automatiques pour l'instant
systemctl stop unattended-upgrades
systemctl disable unattended-upgrades # On le désactive temporairement pour l'install

# Si un processus apt tourne encore, on le tue pour prendre la main
if pgrep -f "apt" > /dev/null; then
    echo "Un processus APT tourne en fond. Tentative d'arrêt..."
    pkill -f apt
    pkill -f unattended-upgr
fi

# Suppression des verrous fantômes (si l'arrêt a été brutal)
rm -f /var/lib/apt/lists/lock
rm -f /var/cache/apt/archives/lock
rm -f /var/lib/dpkg/lock*

# Reconfiguration de dpkg au cas où il aurait été interrompu
dpkg --configure -a

echo "Système de paquets prêt."
# ==========================================
# 1. Configuration du Wi-Fi (Spécifique Ubuntu Server)
# ==========================================
echo "--- 1. Configuration du Wi-Fi ---"

# Installation des outils réseau
if ! command -v nmcli &> /dev/null; then
    echo "Installation de NetworkManager..."
    apt-get update
    apt-get install -y rfkill iw network-manager
fi

# IMPORTANT POUR UBUNTU SERVER :
# On doit dire à Netplan d'utiliser NetworkManager comme backend (renderer)
# Sinon nmcli dira "unmanaged" pour les interfaces.
NETPLAN_CFG="/etc/netplan/01-network-manager-all.yaml"
if [ ! -f "$NETPLAN_CFG" ]; then
    echo "Configuration de Netplan pour utiliser NetworkManager..."
    cat <<EOF > $NETPLAN_CFG
network:
  version: 2
  renderer: NetworkManager
EOF
    chmod 600 $NETPLAN_CFG
    netplan apply
    sleep 5 # Laisser le temps à Netplan d'appliquer
fi

# Déblocage RF (Radio Frequency)
rfkill unblock wifi || true
rfkill unblock all || true

# Activation du service
systemctl enable NetworkManager
systemctl start NetworkManager
sleep 5

echo "Tentative de connexion au SSID : 7Links..."
# Connexion
if nmcli connection show | grep -q "7Links"; then
    echo "La connexion est déjà configurée."
else
    # On tente de se connecter
    nmcli dev wifi connect "7Links" password "#326IsBest#" || echo "Avertissement: Échec de connexion immédiate (peut-être déjà connecté ?)"
fi

# ==========================================
# 2. Installation des prérequis
# ==========================================
echo "--- 2. Installation des prérequis ---"
apt-get update
apt-get install -y git curl build-essential

# Installation de Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js est déjà installé : $(node -v)"
fi

# ==========================================
# 3. Installation des pilotes Phidgets
# ==========================================
echo "--- 3. Installation des pilotes Phidgets ---"

# Ajout de la clé et du repo seulement si pas déjà fait
if [ ! -f /etc/apt/sources.list.d/phidgets.list ]; then
    curl -fsSL https://www.phidgets.com/downloads/setup_linux | bash -
fi

apt-get install -y libphidget22 phidget22networkserver

# Activation du serveur réseau Phidget (écoute sur le port 5661)
systemctl enable phidget22networkserver
systemctl start phidget22networkserver

echo "Pilotes Phidgets installés."

# ==========================================
# 4. Clonage du projet
# ==========================================
echo "--- 4. Récupération du code ---"
TARGET_DIR="$USER_HOME/projet-306-tercier-morales-bersier"

# On corrige les permissions du dossier parent au cas où
chown $REAL_USER:$REAL_USER "$USER_HOME"

if [ -d "$TARGET_DIR" ]; then
    echo "Le dossier existe déjà. Mise à jour..."
    cd "$TARGET_DIR"
    sudo -u $REAL_USER git pull
else
    echo "Clonage du dépôt..."
    # Note : Si le repo est privé, cela demandera un mot de passe et bloquera le script
    # Solution : Utiliser une clé SSH ou un Token dans l'URL
    sudo -u $REAL_USER git clone https://github.com/morales-emma-emf/projet-306-tercier-morales-bersier.git "$TARGET_DIR"
fi

# ==========================================
# 5. Installation des dépendances NPM
# ==========================================
echo "--- 5. Installation des modules NPM ---"
PROJECT_PATH="$TARGET_DIR/code/badge-service/Pointage"

if [ ! -d "$PROJECT_PATH" ]; then
    echo "ERREUR CRITIQUE : Le chemin $PROJECT_PATH n'existe pas !"
    echo "Vérifiez la structure de votre dépôt Git."
    exit 1
fi

cd "$PROJECT_PATH"
echo "Installation des dépendances dans $PROJECT_PATH..."
sudo -u $REAL_USER npm install

# ==========================================
# 6. Création du service Systemd
# ==========================================
echo "--- 6. Création du service de démarrage ---"
SERVICE_FILE="/etc/systemd/system/pointage-service.service"
NODE_BIN=$(which node)

# Création du fichier de service
cat <<EOF > $SERVICE_FILE
[Unit]
Description=Service Porte Badge RFID
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

# Activation du service
systemctl daemon-reload
systemctl enable pointage-service.service
systemctl restart pointage-service.service

echo "=============================================="
echo "INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo "Service : pointage-service"
echo "État actuel :"
systemctl status pointage-service.service --no-pager | head -n 10
echo "=============================================="