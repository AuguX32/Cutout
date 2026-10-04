<p align="center">
  <img src="assets/cutout-logo.png" width="136" alt="Logo CUTOUT" />
</p>

<h1 align="center">CUTOUT</h1>
<p align="center"><strong>Conçu par l'IA, pour l'IA.</strong></p>
<p align="center">Un atelier photo local, créatif et open source pour macOS et Windows.</p>
<p align="center">
  <a href="https://github.com/AuguX32/CUTOUT/releases/tag/v7.0.0">Télécharger CUTOUT 7</a> ·
  <a href="docs/GUIDE-fr.md">Guide d’utilisation</a> ·
  <a href="LICENSE">Licence AGPL-3.0</a>
</p>

CUTOUT réunit le détourage, l’effacement, l’agrandissement, la génération d’images et l’édition par calques dans une interface néo-brutaliste avec mode sombre. Les traitements s’exécutent sur votre ordinateur. Aucun abonnement ni clé d’API n’est nécessaire.

## Fonctionnalités

| Outil | Ce que vous pouvez faire |
| --- | --- |
| **Détourage IA** | Supprimer l’arrière-plan avec plusieurs moteurs locaux : IS-Net, BiRefNet, U²-Net, Silueta et variantes spécialisées. |
| **Effacement contextuel** | Effacer un objet ou une sélection. Le mode automatique reconstruit les fonds unis et dégradés ; Big-LaMa intervient sur les textures. MI-GAN, LaMa et les remplissages OpenCV restent disponibles. |
| **Pinceau magique** | Sélectionner avec une tolérance aux couleurs et aux contours, ajouter ou retirer des zones, échantillonner les calques visibles. |
| **Agrandissement** | Améliorer et agrandir jusqu’à ×8, dans la limite de 24 mégapixels et de 8 192 pixels par côté. |
| **Design IA** | Générer des images, des arrière-plans et des éléments depuis un espace dédié. Régler la taille, le format, les étapes, CFG, la graine et les variantes selon le modèle. |
| **Calques** | Déplacer, dupliquer, réordonner, verrouiller, régler l’opacité et les modes de fusion. Copier-coller entre documents ouverts. |
| **Masques de fusion** | Masquer ou révéler sans supprimer le contenu : pinceau, dureté, intensité, fondus, inversion et adoucissement. |
| **Texte éditable** | Modifier le contenu, la police, la couleur et le fond ; ajouter escalier, vague, arche, perspective, contour et ombre. |
| **Dessin et retouche** | Plume, sélections, pinceaux, tampon, correction, formes, dégradés, filtres et réglages de couleur. |
| **Documents en onglets** | Travailler sur huit documents avec leurs calques et leur historique, dans une limite totale de 40 mégapixels. |
| **Sauvegarde locale** | Restaurer les documents avec un stockage JSON atomique et une sauvegarde de secours. Exporter en PNG, JPEG ou WebP. |
| **Interface** | Thèmes clair et sombre, raccourcis Mac et Windows, présentation néo-brutaliste. |

## Télécharger et installer

Les applications sont disponibles dans la [release v7.0.0](https://github.com/AuguX32/CUTOUT/releases/tag/v7.0.0).

Les installateurs incluent les moteurs de détourage, d’effacement et SDXS. Ils dépassent la limite de 2 Gio par fichier de GitHub Releases : chaque installateur est donc publié en **deux parties**. Ces parties reconstituent exactement le DMG ou l’EXE original, sans modifier l’application.

| Plateforme | Fichiers à télécharger |
| --- | --- |
| macOS Apple Silicon — M1, M2, M3… | [Partie 1](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-macOS-arm64.dmg.part01) · [Partie 2](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-macOS-arm64.dmg.part02) |
| macOS Intel — x64 | [Partie 1](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-macOS-x64.dmg.part01) · [Partie 2](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-macOS-x64.dmg.part02) |
| Windows — x64 | [Partie 1](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-Windows-x64-Setup.exe.part01) · [Partie 2](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7.0.0-Windows-x64-Setup.exe.part02) |

### Reconstituer le fichier

Placez les deux parties dans le même dossier. Sur Mac, ouvrez Terminal dans ce dossier puis utilisez la commande correspondant à votre architecture :

```sh
# Apple Silicon
cat CUTOUT-7.0.0-macOS-arm64.dmg.part01 CUTOUT-7.0.0-macOS-arm64.dmg.part02 > CUTOUT-7.0.0-macOS-arm64.dmg

# Intel
cat CUTOUT-7.0.0-macOS-x64.dmg.part01 CUTOUT-7.0.0-macOS-x64.dmg.part02 > CUTOUT-7.0.0-macOS-x64.dmg
```

Sur Windows, ouvrez **Invite de commandes** dans le dossier :

```bat
copy /b CUTOUT-7.0.0-Windows-x64-Setup.exe.part01+CUTOUT-7.0.0-Windows-x64-Setup.exe.part02 CUTOUT-7.0.0-Windows-x64-Setup.exe
```

Vérifiez ensuite le SHA-256 avec le fichier [CUTOUT-7-SHA256SUMS.txt](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/CUTOUT-7-SHA256SUMS.txt), puis ouvrez le DMG ou l’EXE. Le [manifeste](docs/release-manifest.json) contient aussi la taille et le SHA-256 de chaque partie.

Des scripts facultatifs automatisent le téléchargement, la reconstitution et le contrôle SHA-256 : [Mac](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/download-macos.sh) et [Windows](https://github.com/AuguX32/CUTOUT/releases/download/v7.0.0/download-windows.ps1). Ils n’installent ni ne lancent l’application automatiquement.

**macOS :** ouvrez le DMG puis glissez CUTOUT dans Applications. La version requiert macOS 13 ou ultérieur ; sa signature est locale et elle n’est pas notarisée par Apple.

**Windows :** lancez l’EXE reconstitué puis l’assistant d’installation. Prévoyez environ 7 Go libres pendant l’extraction et l’installation.

## Une IA locale

SDXS est embarqué pour une génération compacte en une étape. Le catalogue propose neuf choix représentant sept familles et deux variantes de précision : SDXS, Tiny-SD, DreamShaper LCM, Stable Diffusion 1.5, SD Turbo et DreamShaper XL Turbo.

Les autres générateurs se téléchargent à la demande depuis des révisions épinglées, avec contrôle de taille et SHA-256. Une connexion est nécessaire pour ce téléchargement initial. Les photos et les prompts restent locaux ; les calculs fonctionnent ensuite hors ligne. Les performances dépendent du modèle, des dimensions et de votre machine. Les modèles XL demandent davantage de mémoire.

## Raccourcis

| Action | Mac | Windows |
| --- | --- | --- |
| Nouveau / importer / enregistrer | ⌘N / ⌘O / ⌘S | Ctrl+N / Ctrl+O / Ctrl+S |
| Copier / coller un calque | ⌘C / ⌘V | Ctrl+C / Ctrl+V |
| Dupliquer le calque | ⌘J | Ctrl+J |
| Annuler / rétablir | ⌘Z / ⇧⌘Z | Ctrl+Z / Ctrl+Maj+Z |
| Exporter | ⇧⌘E | Ctrl+Maj+E |
| Document suivant | Contrôle+Tab | Ctrl+Tab |
| Définir la source du tampon | Option ⌥ + clic | Alt + clic |

Le presse-papiers des calques fonctionne à l’intérieur de CUTOUT, y compris entre les onglets. Le copier-coller classique reste disponible dans les champs de texte.

## Développement

Le dépôt contient les sources de l’interface et de l’application Electron, les tests, les scripts de préparation et les licences. Les installateurs, modèles embarqués et sources complètes se trouvent dans Releases.

Pour démarrer l’interface avec Node.js 24 et pnpm :

```sh
pnpm install
pnpm dev
```

Pour vérifier les sources :

```sh
pnpm test
pnpm test:editor
pnpm build
```

Les moteurs natifs nécessitent l’application de bureau. Pour préparer les ressources sur un hôte de compilation compatible :

```sh
node scripts/prepare-desktop.mjs
node scripts/download-model.mjs
node scripts/prepare-generative.mjs
pnpm build
pnpm desktop
```

La préparation télécharge plusieurs gigaoctets de modèles. La compilation macOS requiert les outils de développement Apple et CMake ; la distribution Windows utilise Electron, NSIS et un module SFX officiel de 7-Zip. Voir les scripts et le [guide détaillé](docs/GUIDE-fr.md). Les exécutables des moteurs sont séparés du processus Electron pour isoler leurs allocations mémoire.

## Validation et limites

La version 7 passe 15 tests automatisés et le scénario de l’éditeur : textes et effets, copier-coller, masques et pinceau de masque, sélections, onglets et sauvegarde atomique. Big-LaMa a été exécuté via le processus Node isolé, ainsi que dans le pipeline de retouche sur une image non carrée. Les DMG et l’archive Windows ont été contrôlés.

Windows et Mac Intel n’ont pas été exécutés sur leurs machines cibles lors de cette livraison. CUTOUT ne prétend pas reproduire toutes les fonctions d’Affinity ou Photoshop ; les reconstructions IA restent dépendantes du contenu et de la taille de la sélection.

## Licence et crédits

Le code de CUTOUT est publié sous [AGPL-3.0-only](LICENSE). Les dépendances, modèles et moteurs conservent leurs propres licences et conditions : consultez [les notices tierces](public/third-party-licenses.txt), les [licences des modèles](public/model-licenses) et les fichiers livrés avec les runtimes.

CUTOUT utilise notamment Electron, ONNX Runtime, OpenCV, IMG.LY, les familles BiRefNet/U²-Net/IS-Net, MI-GAN, LaMa, TensorFlow.js, ESRGAN et stable-diffusion.cpp. Leurs noms et marques appartiennent à leurs auteurs respectifs.
