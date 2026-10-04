# CUTOUT 7 — Studio photo local

Cette version livre des applications de bureau pour Mac Apple Silicon, Mac Intel et Windows x64. Les traitements et les photos restent sur l’appareil. Aucun abonnement ni clé d’API n’est nécessaire ; Les moteurs de détourage, d’effacement et SDXS sont embarqués ; les autres générateurs se téléchargent à la demande.

## Nouveautés de la version 7

### Effacement contextuel

**Contexte automatique** devient le choix par défaut. Il reconstruit les fonds unis et les dégradés à partir des pixels voisins, puis utilise **Big-LaMa FP32** pour les textures. Big-LaMa est une nouvelle exportation des poids de la famille LaMa, embarquée et utilisable hors ligne. Le modèle ajoute 208 Mo. MI-GAN et les moteurs précédents restent disponibles.

La retouche respecte maintenant les proportions de la zone et dispose de davantage de contexte. Le menu Source permet de modifier l’image de base, le calque image sélectionné ou la composition visible. Pour la composition, la réparation est ajoutée dans un nouveau calque transparent : les calques d’origine restent modifiables. Les textes doivent utiliser cette dernière option. Une grande zone effacée peut toujours demander plusieurs essais.

### Textes éditables et effets

Dans les propriétés d’un calque texte : escalier, vague, arche, drapeau, inclinaison et perspective. Réglez l’intensité, l’espacement des lettres, le contour et l’ombre portée. Le texte, la police et les couleurs restent éditables et sont conservés dans le projet JSON.

### Masques de fusion

Dans Calques, créez un masque blanc pour tout révéler ou noir pour tout masquer. Le pinceau du masque dispose d’une taille, d’une dureté et d’une intensité ; choisissez Masquer ou Révéler. Vous pouvez créer un fondu horizontal ou vertical, adoucir, inverser, désactiver ou afficher le masque en niveaux de gris. Le masque modifie la visibilité et conserve le contenu du calque. Une sélection peut toujours servir de masque.

### Copier-coller et raccourcis Mac

Avec l’outil Déplacer, sélectionnez un calque puis **⌘C / ⌘V** : texte, effets et masque sont copiés dans un nouveau calque, également entre documents ouverts. Ce presse-papiers de calques est interne à CUTOUT ; il ne transfère pas les calques vers d’autres applications. Le copier-coller habituel fonctionne dans les champs de texte. Les boutons Copier et Coller restent disponibles dans l’inspecteur.

- ⌘N : nouveau document ; ⌘O : importer ; ⌘S : enregistrer.
- ⌘Z / ⇧⌘Z : annuler / rétablir ; ⌘J : dupliquer le calque.
- ⇧⌘E : exporter ; ⌘A / ⌘D : tout sélectionner / désélectionner.
- **Contrôle + Tab** / Contrôle + Maj + Tab : document suivant / précédent. Commande + Tab reste réservé au changement d’application macOS.
- **Option ⌥ + clic** : définir la source du tampon et de la correction. Option correspond à Alt dans les moteurs ; l’interface Mac affiche Option.
- Touches [ / ] : taille du pinceau ; flèches : déplacement d’un pixel, Maj + flèche : dix pixels.

### Vérifications de cette livraison

Les 15 tests automatisés passent, ainsi que le scénario de l’éditeur : texte modifiable et effets, copier-coller, masques et pinceau de masque, sélections, onglets et sauvegarde atomique. Le vrai modèle Big-LaMa a été exécuté via le processus Node isolé et à travers le pipeline de retouche sur une image non carrée : fond bleu reconstitué et pixels hors masque conservés. Une inférence 512 × 512 prend environ quatre secondes sur le Mac de test ; la durée varie selon la machine. Les formats d’installation Mac et Windows sont vérifiés ; Windows et Mac Intel ne sont pas exécutés sur leurs machines cibles ici. Les applications Mac utilisent une signature locale ad hoc et ne sont pas notarisées par Apple.

## Fonctionnalités conservées de la version 6

### Documents en onglets

Nouveau ou importer une image ouvre un autre document. Les onglets au-dessus de l’image permettent de passer d’un document à l’autre. Chaque document conserve ses calques, sa sélection, son zoom et son historique d’annulation pendant la session. Huit documents peuvent être ouverts, dans une limite totale de 40 mégapixels.

Les documents et leur ordre sont enregistrés ensemble dans le JSON atomique et restaurés au démarrage. L’historique d’annulation et les sélections de travail restent temporaires. La croix ferme un document : exportez-le avant fermeture si vous souhaitez conserver une copie indépendante. Fermer le dernier document vide la session active, sans supprimer les exports.

### Design IA

La carte **Design IA** sur l’accueil ouvre un espace dédié : paramètres à gauche, aperçu à droite, bouton pour continuer dans l’éditeur. Les créations d’images complètes y ouvrent un nouveau document ; les éléments et fonds rejoignent le document courant. Dans l’éditeur, l’outil Génération conserve ces réglages.

Choisir le modèle, la qualité Rapide / Équilibrée / Plus de détails / Personnalisée, le format carré / paysage / portrait ou les dimensions personnalisées, les étapes, CFG, prompt négatif, graine et une à quatre variantes. Les dimensions sont des multiples de 64 entre 256 et la limite du modèle. Les paramètres incompatibles sont refusés par le processus principal. SDXS conserve une étape et CFG 1. Le format PNG / JPEG / WEBP est utilisé lors de l’export ; les calculs et calques restent en PNG pour conserver l’alpha.

**Les modèles supplémentaires ne sont pas embarqués dans les installateurs.** Le bouton Télécharger récupère un fichier depuis une révision Hugging Face épinglée, en flux, puis contrôle sa taille et son SHA-256 avant une installation atomique. Un fichier incomplet ou corrompu n’est pas activé. Le bouton Annuler arrête le téléchargement ou la génération. Une connexion est nécessaire pour télécharger les poids ; l’utilisation ultérieure est locale et hors ligne. Aucune photo et aucun prompt ne sont envoyés à ces sites. Le stockage est dans `generation-models` du dossier de données de l’application.

Il y a neuf choix dans le catalogue, représentant sept familles et deux variantes de précision. Q4 / Q8 changent la quantification des mêmes poids ; ils ne sont pas comptés comme des architectures différentes.

| Choix | Taille du téléchargement | Étapes conseillées | Côté maximum | RAM conseillée |
| --- | --- | --- | --- | --- |
| [SDXS · Ultra rapide](https://huggingface.co/IDKiro/sdxs-512-dreamshaper) | 0.68 Go · embarqué | 1 | 768 px | 4 Go |
| [Tiny-SD · Compact](https://huggingface.co/segmind/tiny-sd) | 0.85 Go | 20 | 768 px | 4 Go |
| [DreamShaper 8 LCM · Compact](https://huggingface.co/Lykon/dreamshaper-8-lcm) | 1.63 Go | 4 | 768 px | 8 Go |
| [DreamShaper 8 LCM · Précision Q8](https://huggingface.co/Lykon/dreamshaper-8-lcm) | 1.80 Go | 4 | 768 px | 8 Go |
| [DreamShaper 7 LCM](https://huggingface.co/SimianLuo/LCM_Dreamshaper_v7) | 2.13 Go | 4 | 768 px | 8 Go |
| [Stable Diffusion 1.5 · Compact](https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5) | 1.57 Go | 20 | 768 px | 8 Go |
| [Stable Diffusion 1.5 · Précision Q8](https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5) | 1.76 Go | 20 | 768 px | 8 Go |
| [SD Turbo · Rapide](https://huggingface.co/stabilityai/sd-turbo) | 2.02 Go | 1 | 768 px | 8 Go |
| [DreamShaper XL Turbo · Grand format](https://huggingface.co/Lykon/dreamshaper-xl-v2-turbo) | 2.80 Go | 6 | 1024 px | 16 Go |

Le moteur reste CPU pour une meilleure portabilité. Un modèle plus petit ne garantit pas une génération plus rapide : Tiny-SD utilise normalement vingt étapes, alors que SDXS en utilise une. Les modèles XL demandent beaucoup plus de mémoire et de temps. Les réglages de résolution / nombre d’étapes influencent les résultats, sans garantir la qualité d’un service cloud.

### Pinceau magique

Le pinceau de sélection dispose maintenant d’un mode magique activé par défaut. Il suit une région de couleur connectée sous le pinceau, dans un espace luminance / chrominance, et évite de franchir les transitions de couleur fortes. Les traits rapides sont interpolés pour éviter les trous ; le bord circulaire est anticrénelé. Le calcul est limité à la zone du pinceau pour rester indépendant de la taille totale du document.

L’option Échantillonner tous les calques visibles sélectionne à partir du rendu de la composition, y compris le texte et les calques verrouillés ; sinon seul le calque raster actif est utilisé. Maj ajoute, Option ⌥ sur Mac / Alt sur Windows retire. Régler la taille et la tolérance, puis adoucir ou étendre le contour si nécessaire. Décocher Pinceau magique pour sélectionner librement. La baguette magique bénéficie aussi de l’échantillonnage de tous les calques. Il s’agit d’une sélection guidée par les couleurs, pas d’une reconnaissance sémantique : des sujets de couleur proche du fond restent difficiles.

### Vérification

Tests des paramètres IPC, intégrité SHA-256, conservation d’un modèle valide après un téléchargement corrompu, sauvegarde JSON de deux documents et relecture, changements d’onglets avec calques / historique indépendants, fermeture d’onglets, navigation Design IA, et arrêt du pinceau sur un contour contrasté. Génération réelle avec SDXS, Tiny-SD et DreamShaper 8 LCM Q4 sur le Mac disponible (ce dernier : environ 50 secondes à quatre étapes en 512 × 512) ; les autres modèles du catalogue ont des fichiers et empreintes vérifiés, mais toute la gamme n’a pas été évaluée sur chaque système. Les limites de test Mac Intel / Windows et la distribution non notarée restent identiques à la version précédente.

## Installer

- Mac : ouvrir le DMG puis glisser CUTOUT dans Applications. Le moteur de génération est compilé pour macOS 13 et versions suivantes. Choisir arm64 pour Apple Silicon, x64 pour Intel.
- Windows : lancer l’EXE puis suivre l’assistant. Le programme installe l’application x64 dans le dossier de votre choix. La désinstallation conserve vos données.
- Prévoir environ 3 Go de disque pour l’application et davantage pour les projets. Les installateurs sont volumineux parce que tous les moteurs sont inclus.
- Applications non notarées / non signées avec un certificat de distribution personnel. Apple Silicon a été exécuté et vérifié sur le Mac disponible. Les binaires Intel et Windows sont construits et vérifiés structurellement ; leur exécution sur ces systèmes n’a pas été testée ici.

## Interface et thème

L’accueil conserve le style néo-brutaliste : Syne, Manrope, rouge, vert acide, bordures franches. Le studio place la barre d’outils à gauche, le document au centre et les réglages à droite. Dans l’inspecteur, les onglets **Outil** et **Calques** évitent de chercher les calques au bas d’un long panneau.

Le bouton Clair / Sombre change le thème. Le choix est enregistré atomiquement dans `settings.json` et restauré au prochain lancement. Sans choix enregistré, le thème suit celui du système au démarrage.

## Outils ajoutés et comparaison avec Affinity

L’inventaire a été construit à partir de la [documentation officielle d’Affinity Photo 2](https://affinity.help/photo2/English.lproj/) et de son [guide de l’interface](https://affinity.help/photo2/fr.lproj/pages/Workspace/interface.html). Les outils sont implémentés dans CUTOUT ; aucun code propriétaire d’Affinity ou Photoshop n’a été copié.

| Famille du guide Affinity | Couverture de CUTOUT 7 |
| --- | --- |
| Navigation | Déplacer, main, zoom, ajustement à la fenêtre, mesure en pixels et angle, grille et aimantation |
| Sélection | Rectangle, ellipse, lasso libre, baguette magique avec tolérance et pixels contigus ou globaux, pinceau de sélection ; Maj ajoute, Option ⌥ sur Mac / Alt sur Windows soustrait ; inversion, contour adouci, extension / réduction, copie vers un calque, suppression, transfert au remplissage IA |
| Plume / nœuds | Tracé Bézier, fermeture, déplacement des points et poignées ; découpe, copie, suppression, déplacement du sujet sur son nouveau calque |
| Peinture / remplissage | Pinceau, gomme, pot de peinture, pipette, dégradé interactif ; sélection appliquée aux peintures et filtres |
| Retouche | Tampon de clonage, correcteur par clonage adouci, flou et netteté locaux, éclaircir, assombrir, saturation locale, doigt ; taille et intensité réglables |
| Formes | 24 formes : rectangle, arrondi, ellipse, triangle, losange, polygone, étoile, flèche, cœur, anneau, nuage, segment, trapèze, double étoile, étoile carrée, secteur, segment circulaire, croissant, engrenage, bulles rectangulaire et elliptique, goutte, spirale et chat ; remplissage / contour, branches paramétrables |
| QR code | Génération UTF-8 locale, marge de sécurité, ajout sur un calque image |
| Texte | Contenu modifiable, six familles de polices, taille, graisse, italique, couleur, fond et marge du fond ; double-clic sur le texte pour ouvrir ses réglages |
| Calques | Image principale, images, textes et dégradés ; visibilité, verrouillage, duplication, ordre, opacité, rotation, échelle, miroirs, coordonnées, alignement, fusion avec le dessous, masque depuis la sélection et inversion du masque |
| Fusion | 16 modes : normal, produit, écran, incrustation, obscurcir, éclaircir, densité couleur + / −, lumières dure / douce, différence, exclusion, teinte, saturation, couleur et luminosité |
| Dégradé | Segment sur le calque choisi, extrémités et point médian déplaçables, couleurs de début et de fin ; création d’un calque de dégradé indépendant |
| Réglages / filtres | Luminosité, contraste et saturation modifiables ; 18 filtres de pixels : exposition, gamma / point médian, température, vibrance, niveaux automatiques, noir et blanc, négatif, sépia, flou, netteté, médiane, passe-haut, contours, grain, pixellisation, postérisation, seuil, vignette ; histogramme RVB |
| Déformation | Maillage 3 × 3 et mode quatre coins ; déplacement des points puis application par interpolation triangulaire |
| Document / export | Document vierge, dimensions, redimensionnement, recadrage, annuler / rétablir, PNG transparent, JPEG sur fond blanc et WEBP |

La barre du studio comporte 29 outils. Les formes sont rasterisées lors du dessin. Le correcteur est un outil de clonage local, distinct d’un correcteur sémantique avancé. Le réglage Gamma offre un point médian ; il ne remplace pas un éditeur de courbes multipoints. La déformation à quatre coins utilise le maillage triangulaire, pas une homographie photographique complète.

**La couverture des suites Affinity / Photoshop reste partielle.** Le développement RAW, CMJN / gestion ICC professionnelle, import et export PSD / PSB / AFPhoto, HDR, panoramas, empilement de mise au point, espaces de travail Liquify complets, groupes hiérarchiques, macros / traitements par lots, tranches d’export et texte vectoriel sur un tracé ne sont pas intégrés. Les formats de travail sont PNG / JPEG / WEBP et les projets JSON de CUTOUT.

## Génération locale SDXS

Le modèle retenu est [SDXS-512-DreamShaper](https://huggingface.co/IDKiro/sdxs-512-dreamshaper), un modèle de diffusion distillé en une étape, décrit dans [l’article SDXS](https://arxiv.org/abs/2403.16627). Il fonctionne avec [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp/blob/master/docs/distilled_sd.md), dans un processus séparé. Aucun Python, service cloud ou compte Hugging Face n’est nécessaire pour utiliser l’application.

Les poids Q8 font **682 847 200 octets**, soit environ **683 Mo / 651 Mio**. La quantification Q4 testée a dégradé les images ; elle a été écartée. « Léger » reste relatif à un générateur d’images : ce modèle ne tient pas dans quelques mégaoctets.

Dans l’accueil, choisir **Design IA**, ou utiliser ✳ dans le studio. Décrire le sujet, choisir la destination et la graine, puis générer :

- **Élément** : génération sur fond clair, puis détourage IS-Net automatique et ajout d’un calque transparent.
- **Arrière-plan** : image générée placée derrière les autres calques et agrandie pour couvrir le document.
- **Image complète** : ajout d’un nouveau calque image. Sans document, CUTOUT crée d’abord un document vierge.

Les sorties sont **512 × 512 px**. Les descriptions en anglais donnent les meilleurs résultats. Exemples : `a single yellow rubber duck, studio product photograph`, `a minimal pastel mountain landscape`, `a small red ceramic teapot on white background`. Les éléments simples sont plus fiables que le texte, les mains, les visages détaillés ou une composition exigeante. Les détails et le nombre d’objets peuvent différer du prompt. Le détourage d’un élément peut demander une correction au pinceau ou à la plume.

Sur le Mac de vérification : environ **6–7 s** de génération CPU, **11 s** pour une génération suivie du détourage et de l’insertion dans le studio. Le processus génératif a atteint environ **849 Mo de mémoire** lors d’une mesure. Ces valeurs dépendent de la machine et du prompt. La génération utilise quatre threads CPU et peut être annulée. Le moteur est fermé après chaque opération.

## Détourage et effacement

Huit choix de détourage : IS-Net, U²-Net léger, Silueta, U²-Net, U²-Net Human, IS-Net Anime, BiRefNet Lite et BiRefNet complet. Leurs performances dépendent du type de photo. IS-Net est le choix équilibré ; U²-Net léger privilégie la vitesse.

Le crash Mac de BiRefNet a été relié à une allocation ONNX Runtime dans le processus Electron. Les modèles natifs tournent désormais avec un Node autonome embarqué, dans un processus isolé, avec l’arène mémoire CPU désactivée. Un arrêt du modèle renvoie une erreur à l’éditeur. BiRefNet complet a terminé un détourage dans le paquet Mac de cette version, sans fermer l’application.

Effacement : **Contexte automatique**, **Big-LaMa FP32**, **MI-GAN**, **LaMa**, **OpenCV Telea** et **OpenCV Navier–Stokes**. Peindre tout l’objet et son ombre ; ajuster la marge de sélection pour éviter les restes aux contours. MI-GAN et LaMa utilisent la région autour de la sélection, reconstruisent les pixels et recomposent la zone sélectionnée. Une détection automatique des régions de premier plan complète le pinceau ; elle peut regrouper des objets qui se touchent.

L’agrandissement ESRGAN va jusqu’à ×8 avec trois passes ×2. Limite de sortie : 24 mégapixels et 8 192 px de côté. Les détails reconstruits restent des estimations.

## Sauvegarde et limites

Les images, calques, textes, masques et dégradés sont sauvegardés dans `cutout.json`. Écriture dans un fichier temporaire, synchronisation disque, renommage atomique et sauvegarde `.bak`. Une sauvegarde corrompue est conservée et la copie valide précédente peut être restaurée. Le bouton **Stockage JSON** affiche le fichier.

Mac : `~/Library/Application Support/CUTOUT/`. Windows : `%APPDATA%/CUTOUT/`. Les paramètres du thème sont dans `settings.json`, écrit atomiquement.

- Import : PNG / JPEG / WEBP, 15 Mo, 25 mégapixels maximum.
- Composition : 30 calques, sauvegarde JSON maximale de 260 Mio.
- Annulation : six étapes au maximum, avec budget total de 90 Mio ; les images lourdes peuvent réduire la profondeur.
- Recadrage : fusion de la composition ; Annuler restaure les calques.
- Les traitements IA de détourage / agrandissement / effacement visent l’image principale. Les outils du studio et les filtres visent le calque sélectionné.
- Les masques de sélection du studio sont temporaires ; les masques attachés aux calques sont sauvegardés.

## Vérification et sources

Les tests de sauvegarde et de pixels passent, ainsi que les tests de régression de l’éditeur : texte / fond / police, verrouillage, sélection, suppression, annulation, filtre, QR UTF-8 et thème sombre. Les modèles natifs de détourage et de remplissage ont été exécutés sur CPU. Le parcours de génération et le détourage BiRefNet ont été exécutés dans l’application Mac isolée.

Les sources incluent les manifestes des modèles, leurs empreintes SHA-256, les scripts de préparation et les licences. `pnpm install`, `pnpm test`, `pnpm test:editor`, `pnpm build`. Préparer les ressources avec `node scripts/prepare-desktop.mjs` et `node scripts/prepare-generative.mjs` avant les paquets de bureau. La compilation du moteur génératif sur Mac demande Git, CMake et les outils de ligne de commande Xcode. Voir le README pour les commandes de distribution.

Les nouveaux outils ne sont pas publiés sur le site. L’ancien site CUTOUT reste privé ; l’API Sites disponible dans cette session ne propose pas sa suppression. Les livrables de cette version sont les applications.

### Installation Windows et reconstruction

L’EXE extrait les fichiers dans le dossier temporaire, puis lance l’assistant d’installation en français. Prévoir environ 7 Go libres pendant cette étape. Les bibliothèques Microsoft Visual C++ nécessaires sont incluses dans les dossiers de l’application.

Pour reconstruire l’installateur après le build Electron Windows, installer NSIS et 7-Zip, puis définir `CUTOUT_MAKENSIS`, `CUTOUT_7ZIP` et `CUTOUT_SFX_MODULE` (module officiel `bin/7zSD.sfx` du SDK LZMA). Exécuter `node scripts/build-windows-installer.mjs`. Le script assemble un SFX 7-Zip avec un petit assistant NSIS et conserve les données utilisateur lors de la désinstallation.
