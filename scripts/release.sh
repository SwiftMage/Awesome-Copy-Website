#!/usr/bin/env bash
# release.sh — Build DMG and generate signed Sparkle appcast
# Usage: ./scripts/release.sh [/path/to/AwesomeCopy.app]
# If no argument given, auto-detects a single .app on the Desktop.

set -euo pipefail

DOWNLOAD_URL_PREFIX="https://wyddjiqfiabegjasyksr.supabase.co/storage/v1/object/public/DMG/releases/"
WEBSITE_REPO="$(cd "$(dirname "$0")/.." && pwd)"

# ── Find Sparkle tools ────────────────────────────────────────────────────────
SPARKLE_BIN=$(find ~/Library/Developer/Xcode/DerivedData \
    -path "*/artifacts/sparkle/Sparkle/bin/generate_appcast" 2>/dev/null \
    | head -1 | xargs -I{} dirname {} 2>/dev/null || true)

if [[ -z "$SPARKLE_BIN" ]]; then
    echo "Error: Sparkle tools not found in DerivedData. Open the Xcode project and build once."
    exit 1
fi

# ── Locate .app ───────────────────────────────────────────────────────────────
if [[ $# -gt 0 ]]; then
    APP_PATH="${1%/}"
else
    mapfile -t APPS < <(find ~/Desktop -maxdepth 1 -name "*.app" -type d 2>/dev/null)
    if [[ ${#APPS[@]} -eq 0 ]]; then
        echo "Error: no .app found on Desktop. Pass the path as an argument."
        exit 1
    elif [[ ${#APPS[@]} -gt 1 ]]; then
        echo "Multiple .app files on Desktop — specify one:"
        printf '  %s\n' "${APPS[@]}"
        exit 1
    fi
    APP_PATH="${APPS[0]}"
fi

[[ ! -d "$APP_PATH" ]] && { echo "Error: not found: $APP_PATH"; exit 1; }

# ── Read version from bundle ──────────────────────────────────────────────────
PLIST="$APP_PATH/Contents/Info.plist"
VERSION=$(defaults read "$PLIST" CFBundleShortVersionString)
BUILD=$(defaults read "$PLIST" CFBundleVersion)
DMG_NAME="AwesomeCopy-${VERSION}-${BUILD}.dmg"
DMG_PATH="$HOME/Desktop/$DMG_NAME"

echo "App:     $APP_PATH"
echo "Version: $VERSION  Build: $BUILD"
echo "DMG:     $DMG_NAME"
echo ""

# ── Create DMG ────────────────────────────────────────────────────────────────
echo "▶ Creating DMG..."
STAGING=$(mktemp -d)
cp -R "$APP_PATH" "$STAGING/"
ln -s /Applications "$STAGING/Applications"
hdiutil create \
    -volname "Awesome Copy" \
    -srcfolder "$STAGING" \
    -ov -format UDZO \
    "$DMG_PATH" 1>/dev/null
rm -rf "$STAGING"
echo "  $(stat -f%z "$DMG_PATH") bytes → $DMG_PATH"
echo ""

# ── Generate appcast ──────────────────────────────────────────────────────────
echo "▶ Generating appcast..."
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
ln -s "$DMG_PATH" "$WORK_DIR/$DMG_NAME"
"$SPARKLE_BIN/generate_appcast" \
    --download-url-prefix "$DOWNLOAD_URL_PREFIX" \
    "$WORK_DIR/"
APPCAST="$WORK_DIR/appcast.xml"

# ── Sign if generate_appcast didn't ──────────────────────────────────────────
if ! grep -q "edSignature" "$APPCAST"; then
    echo "  Signature missing — running sign_update..."
    SIGN_OUT=$("$SPARKLE_BIN/sign_update" "$DMG_PATH")
    python3 - "$APPCAST" "$SIGN_OUT" <<'PYEOF'
import sys, re
path, sign_out = sys.argv[1], sys.argv[2]
m = re.search(r'sparkle:edSignature="[^"]+"', sign_out)
if not m: sys.exit("Error: no edSignature in sign_update output")
content = open(path).read()
open(path, 'w').write(content.replace(' length="', f' {m.group()} length="', 1))
PYEOF
    echo "  Signed."
else
    echo "  Signed ✓"
fi

echo ""
cat "$APPCAST"
echo ""

# ── Copy appcast to website repo ──────────────────────────────────────────────
echo "▶ Copying appcast.xml → $WEBSITE_REPO/appcast.xml"
cp "$APPCAST" "$WEBSITE_REPO/appcast.xml"

echo ""
echo "✓ Done!"
echo ""
echo "Next steps:"
echo "  1. Upload to Supabase (Storage → DMG → releases):"
echo "       $DMG_PATH"
echo ""
echo "  2. Commit and deploy:"
echo "       cd \"$WEBSITE_REPO\""
echo "       git add appcast.xml"
echo "       git commit -m \"Release $VERSION (build $BUILD)\""
echo "       git push"
