#!/bin/bash
# DentistryGPT Passerelle — Installateur macOS
# Usage: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/agentik-os/dentistrygpt-passerelle/main/install.sh)"

set -e

APP_NAME="DentistryGPT Passerelle"
INSTALL_DIR="/Applications"
TMP_DMG="/tmp/dentistrygpt-passerelle.dmg"

echo ""
echo "  DentistryGPT Passerelle — Installation"
echo "  ======================================="
echo ""

# Get latest release DMG URL
echo "  Recherche de la derniere version..."
DMG_URL=$(curl -s https://api.github.com/repos/agentik-os/dentistrygpt-passerelle/releases/latest \
  | grep "browser_download_url.*arm64\.dmg\"" \
  | head -1 \
  | cut -d '"' -f 4)

if [ -z "$DMG_URL" ]; then
  echo "  Erreur : impossible de trouver le lien de telechargement."
  exit 1
fi

# Download
echo "  Telechargement en cours..."
curl -sL "$DMG_URL" -o "$TMP_DMG"

# Mount
echo "  Installation..."
MOUNT_DIR=$(hdiutil attach "$TMP_DMG" -nobrowse -quiet 2>&1 | grep "/Volumes/" | sed 's/.*\/Volumes/\/Volumes/')

if [ -z "$MOUNT_DIR" ]; then
  # Fallback: try to find the volume
  MOUNT_DIR="/Volumes/$APP_NAME"
  hdiutil attach "$TMP_DMG" -nobrowse -quiet 2>/dev/null || true
  sleep 1
fi

# Find and copy .app
APP_PATH=$(find "$MOUNT_DIR" -maxdepth 1 -name "*.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
  echo "  Erreur : application non trouvee dans le DMG."
  hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null
  rm -f "$TMP_DMG"
  exit 1
fi

# Remove old version if exists
rm -rf "$INSTALL_DIR/$APP_NAME.app" 2>/dev/null

# Copy to Applications
cp -R "$APP_PATH" "$INSTALL_DIR/"

# Remove quarantine
xattr -cr "$INSTALL_DIR/$APP_NAME.app" 2>/dev/null

# Cleanup
hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null
rm -f "$TMP_DMG"

# Launch
echo "  Lancement..."
open "$INSTALL_DIR/$APP_NAME.app"

echo ""
echo "  Installation terminee !"
echo ""
