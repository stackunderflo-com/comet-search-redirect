#!/usr/bin/env node

/**
 * Script de build personnalisé pour l'extension Comet Search Redirect
 * Crée un package optimisé pour le Chrome Web Store
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  distDir: path.resolve(__dirname, '../dist'),
  packageName: 'package.zip',
  excludePatterns: [
    '*.map',
    'test/**',
    'coverage/**',
    'node_modules/**',
    '.git/**',
    '.github/**',
    'scripts/**',
    'webpack.config.js',
    'jest.config.js',
    '.eslintrc.json',
    'package.json',
    'package-lock.json',
    'README.md',
    'CLAUDE.md',
    'ROADMAP.md'
  ]
};

/**
 * Affiche un message avec timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Vérifie si un fichier/dossier existe
 */
function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Supprime un fichier ou dossier récursivement
 */
function removeSync(filePath) {
  try {
    if (exists(filePath)) {
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
      return true;
    }
  } catch (error) {
    log(`Erreur suppression ${filePath}: ${error.message}`, 'error');
    return false;
  }
  return true;
}

/**
 * Valide le manifest.json
 */
function validateManifest() {
  log('Validation du manifest...');

  const manifestPath = path.join(CONFIG.distDir, 'manifest.json');
  if (!exists(manifestPath)) {
    throw new Error('manifest.json non trouvé dans le dossier dist/');
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Vérifications obligatoires
    const required = ['manifest_version', 'name', 'version', 'permissions'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Champ obligatoire manquant dans manifest.json: ${field}`);
      }
    }

    // Vérifier Manifest V3
    if (manifest.manifest_version !== 3) {
      throw new Error('Seul Manifest V3 est supporté');
    }

    // Vérifier la version
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Format de version invalide (attendu: x.y.z)');
    }

    log(`Manifest valide: ${manifest.name} v${manifest.version}`, 'success');
    return manifest;
  } catch (error) {
    throw new Error(`Erreur validation manifest: ${error.message}`);
  }
}

/**
 * Vérifie la présence des fichiers requis
 */
function checkRequiredFiles() {
  log('Vérification des fichiers requis...');

  const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js'
  ];

  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(CONFIG.distDir, file);
    if (!exists(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Fichiers manquants: ${missingFiles.join(', ')}`);
  }

  log('Tous les fichiers requis sont présents', 'success');
}

/**
 * Vérifie les icônes (seulement 128px requis)
 */
function checkIcons() {
  log('Vérification des icônes...');

  const iconsDir = path.join(CONFIG.distDir, 'icons');
  const requiredIcon = 'icon-128.png';

  if (!exists(iconsDir)) {
    throw new Error('Dossier icons/ manquant dans dist/');
  }

  const iconPath = path.join(iconsDir, requiredIcon);
  if (!exists(iconPath)) {
    throw new Error(`Icône requise manquante: ${requiredIcon}`);
  }

  log('Icône 128px présente', 'success');
}

/**
 * Vérifie que les assets du store sont prêts (pour information seulement)
 */
function checkStoreAssetsAvailability() {
  log('Vérification des assets Chrome Web Store...');

  const storeAssetsDir = path.resolve(__dirname, '../store-assets');

  const info = {
    hasDescription: false,
    hasScreenshots: false,
    screenshotCount: 0
  };

  // Vérifier description.txt
  const descriptionSrc = path.join(storeAssetsDir, 'description.txt');
  if (exists(descriptionSrc)) {
    info.hasDescription = true;
    log('✅ Description prête dans store-assets/description.txt');
  } else {
    log('⚠️ description.txt non trouvé dans store-assets/', 'warning');
  }

  // Vérifier screenshots
  const screenshotsSrcDir = path.join(storeAssetsDir, 'screenshots');
  if (exists(screenshotsSrcDir)) {
    const screenshots = fs.readdirSync(screenshotsSrcDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    if (screenshots.length > 0) {
      info.hasScreenshots = true;
      info.screenshotCount = screenshots.length;
      log(`✅ ${screenshots.length} screenshot(s) prêts dans store-assets/screenshots/`);
    } else {
      log('⚠️ Aucun screenshot trouvé dans store-assets/screenshots/', 'warning');
    }
  } else {
    log('⚠️ Dossier screenshots non trouvé', 'warning');
  }

  log('ℹ️ Note: Les assets du store doivent être uploadés manuellement sur Chrome Web Store');

  return info;
}

/**
 * Crée le package ZIP pour Chrome Web Store (extension uniquement)
 */
function createPackage() {
  return new Promise((resolve, reject) => {
    log('Création du package ZIP extension...');

    const outputPath = path.resolve(__dirname, '..', CONFIG.packageName);

    // Supprimer l'ancien package
    removeSync(outputPath);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression maximale
    });

    output.on('close', () => {
      const sizeKB = Math.round(archive.pointer() / 1024);
      log(`Package créé: ${CONFIG.packageName} (${sizeKB} KB)`, 'success');
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      log(`Erreur création package: ${err.message}`, 'error');
      reject(err);
    });

    archive.pipe(output);

    // Ajouter uniquement les fichiers de l'extension (pas store-assets)
    archive.directory(CONFIG.distDir, false);

    archive.finalize();
  });
}

/**
 * Nettoie les fichiers de développement du dist
 */
function cleanDist() {
  log('Nettoyage des fichiers de développement...');

  const filesToRemove = [
    path.join(CONFIG.distDir, 'background.js.map'),
    path.join(CONFIG.distDir, 'content.js.map'),
    path.join(CONFIG.distDir, 'popup.js.map')
  ];

  for (const file of filesToRemove) {
    if (exists(file)) {
      removeSync(file);
      log(`Supprimé: ${path.basename(file)}`);
    }
  }
}

/**
 * Affiche les informations du package final
 */
function showPackageInfo() {
  log('='.repeat(50));
  log('📦 PACKAGE PRÊT POUR CHROME WEB STORE');
  log('='.repeat(50));

  const packagePath = path.resolve(__dirname, '..', CONFIG.packageName);
  const stats = fs.statSync(packagePath);
  const sizeKB = Math.round(stats.size / 1024);

  log(`Fichier: ${CONFIG.packageName}`);
  log(`Taille: ${sizeKB} KB`);
  log(`Chemin: ${packagePath}`);
  log('');
  log('Prochaines étapes:');
  log('1. Aller sur https://chrome.google.com/webstore/devconsole/');
  log('2. Créer un nouvel élément ou mettre à jour');
  log('3. Uploader le fichier package.zip');
  log('4. Compléter les informations store');
  log('5. Soumettre pour review');
  log('='.repeat(50));
}

/**
 * Affiche les informations du package final
 */
function showPackageInfo(storeAssets) {
  log('='.repeat(60));
  log('📦 PACKAGE EXTENSION PRÊT POUR CHROME WEB STORE');
  log('='.repeat(60));

  const packagePath = path.resolve(__dirname, '..', CONFIG.packageName);
  const stats = fs.statSync(packagePath);
  const sizeKB = Math.round(stats.size / 1024);

  log(`Fichier: ${CONFIG.packageName}`);
  log(`Taille: ${sizeKB} KB`);
  log(`Chemin: ${packagePath}`);
  log('');
  log('Contenu du package.zip:');
  log('├── manifest.json       # Configuration extension');
  log('├── background.js       # Service Worker');
  log('├── content.js          # Script contenu');
  log('├── popup.html/.js      # Interface popup');
  log('└── icons/              # Icône extension (128px)');
  log('');
  log('Assets du store (uploadés séparément):');

  if (storeAssets.hasDescription) {
    log('✅ Description: store-assets/description.txt');
  } else {
    log('⚠️ Description manquante: store-assets/description.txt');
  }

  if (storeAssets.hasScreenshots && storeAssets.screenshotCount > 0) {
    log(`✅ Screenshots: ${storeAssets.screenshotCount} image(s) dans store-assets/screenshots/`);
  } else {
    log('⚠️ Screenshots manquants: store-assets/screenshots/');
  }

  log('');
  log('Prochaines étapes:');
  log('1. Aller sur https://chrome.google.com/webstore/devconsole/');
  log('2. Uploader package.zip (extension uniquement)');
  log('3. Onglet "Store Listing" → Copier description depuis store-assets/description.txt');
  log('4. Onglet "Store Listing" → Uploader screenshots depuis store-assets/screenshots/');
  log('5. Compléter les autres champs et soumettre pour review');
  log('');
  log('⚠️ IMPORTANT: Screenshots et description longue sont uploadés MANUELLEMENT');
  log('   dans la console développeur, PAS dans le package.zip');
  log('='.repeat(60));
}

/**
 * Fonction principale
 */
async function main() {
  try {
    log('🚀 Début du build de production');

    // Vérifier que dist/ existe
    if (!exists(CONFIG.distDir)) {
      throw new Error('Dossier dist/ non trouvé. Lancez d\'abord "npm run build"');
    }

    // Étapes de validation et préparation
    checkRequiredFiles();
    const manifest = validateManifest();
    checkIcons();
    cleanDist();

    // Vérifier les assets du store (pour information)
    const storeAssets = checkStoreAssetsAvailability();

    // Création du package extension
    await createPackage();

    // Informations finales
    showPackageInfo(storeAssets);

    log('✅ Build de production terminé avec succès!', 'success');
    process.exit(0);

  } catch (error) {
    log(`❌ Erreur build: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  main,
  validateManifest,
  checkRequiredFiles,
  createPackage
};