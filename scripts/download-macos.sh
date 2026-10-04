#!/bin/bash
# CUTOUT 7: download the original macOS installer and verify its SHA-256.
set -euo pipefail
arch="${1:-$(uname -m)}"
case "$arch" in arm64) ;; x64|x86_64) arch=x64 ;; *) echo "Usage: bash download-macos.sh [arm64|x64]" >&2; exit 2 ;; esac
base="https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0"
name="CUTOUT-7.0.0-macOS-$arch.dmg"
case "$arch" in
  arm64) expected="ec037f47381255b02e3f887cedb2220a8568b425a51c1aecccc315cdfc67b4b1" ;;
  x64) expected="6d893f16b37d32e9613641b8e74622f1470bcc49a701b6fa80755c21eaac5e4a" ;;
esac
output="$PWD/$name"
if [ -e "$output" ]; then echo "Le fichier existe déjà : $output" >&2; exit 1; fi
work=$(mktemp -d "${TMPDIR:-/tmp}/cutout-download.XXXXXX")
trap 'rm -rf "$work"' EXIT
for part in part01 part02; do
  curl --fail --location --retry 3 --output "$work/$name.$part" "$base/$name.$part"
done
cat "$work/$name.part01" "$work/$name.part02" > "$work/$name"
actual=$(shasum -a 256 "$work/$name" | cut -d ' ' -f 1)
if [ "$actual" != "$expected" ]; then echo "Échec du contrôle SHA-256. Aucun installateur n’a été conservé." >&2; exit 1; fi
mv "$work/$name" "$output"
echo "Téléchargement vérifié : $output"
echo "Ouvrez le DMG puis glissez CUTOUT dans Applications."
