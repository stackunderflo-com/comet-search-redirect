#!/usr/bin/env node

/**
 * Script to prepare Chrome Web Store assets and validate publication readiness
 * Creates a comprehensive checklist and organizes all store materials
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  storeAssetsDir: path.resolve(__dirname, '../store-assets'),
  screenshotsDir: path.resolve(__dirname, '../store-assets/screenshots'),
  packageFile: path.resolve(__dirname, '../package.zip'),
  storeAssetsZip: path.resolve(__dirname, '../store-assets.zip')
};

/**
 * Logging function with timestamp and colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const colors = {
    info: '\x1b[36m',     // Cyan
    success: '\x1b[32m',  // Green
    warning: '\x1b[33m',  // Yellow
    error: '\x1b[31m',    // Red
    reset: '\x1b[0m'      // Reset
  };

  const color = colors[type] || colors.info;
  const prefix = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  console.log(`${color}[${timestamp}] ${prefix} ${message}${colors.reset}`);
}

/**
 * Check if file exists
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
  } catch (error) {
    return 0;
  }
}

/**
 * Validate store assets
 */
function validateStoreAssets() {
  log('Validating store assets...');

  const issues = [];
  const warnings = [];

  // Check description.txt
  const descriptionPath = path.join(CONFIG.storeAssetsDir, 'description.txt');
  if (!exists(descriptionPath)) {
    issues.push('description.txt is missing');
  } else {
    const content = fs.readFileSync(descriptionPath, 'utf8');
    if (content.length < 100) {
      warnings.push('description.txt seems too short (< 100 chars)');
    }
    if (content.length > 16000) {
      issues.push('description.txt is too long (> 16000 chars for Chrome Web Store)');
    }
  }

  // Check store-listing.json
  const listingPath = path.join(CONFIG.storeAssetsDir, 'store-listing.json');
  if (!exists(listingPath)) {
    issues.push('store-listing.json is missing');
  } else {
    try {
      const listing = JSON.parse(fs.readFileSync(listingPath, 'utf8'));
      if (!listing.name || !listing.short_description) {
        issues.push('store-listing.json missing required fields');
      }
    } catch (error) {
      issues.push('store-listing.json is not valid JSON');
    }
  }

  // Check screenshots directory
  if (!exists(CONFIG.screenshotsDir)) {
    issues.push('screenshots/ directory is missing');
  } else {
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    if (screenshots.length === 0) {
      warnings.push('No screenshots found in screenshots/ directory');
    } else if (screenshots.length > 5) {
      warnings.push('More than 5 screenshots (Chrome Web Store limit is 5)');
    }

    // Check screenshot sizes
    screenshots.forEach(screenshot => {
      const screenshotPath = path.join(CONFIG.screenshotsDir, screenshot);
      const sizeKB = getFileSizeKB(screenshotPath);
      if (sizeKB > 3000) { // 3MB limit
        warnings.push(`Screenshot ${screenshot} is large (${sizeKB}KB) - consider optimizing`);
      }
    });
  }

  return { issues, warnings };
}

/**
 * Validate extension package
 */
function validatePackage() {
  log('Validating extension package...');

  const issues = [];

  if (!exists(CONFIG.packageFile)) {
    issues.push('package.zip not found - run "npm run package" first');
  } else {
    const sizeKB = getFileSizeKB(CONFIG.packageFile);
    log(`Package size: ${sizeKB} KB`);

    if (sizeKB > 20480) { // 20MB limit
      issues.push(`Package too large (${sizeKB}KB) - Chrome Web Store limit is 20MB`);
    }
  }

  return issues;
}

/**
 * Create store assets ZIP for easy upload
 */
function createStoreAssetsZip() {
  return new Promise((resolve, reject) => {
    log('Creating store assets ZIP...');

    if (!exists(CONFIG.screenshotsDir)) {
      reject(new Error('Screenshots directory not found'));
      return;
    }

    const output = fs.createWriteStream(CONFIG.storeAssetsZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeKB = Math.round(archive.pointer() / 1024);
      log(`Store assets ZIP created: ${sizeKB} KB`, 'success');
      resolve(CONFIG.storeAssetsZip);
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add screenshots
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
      .slice(0, 5); // Chrome Web Store limit

    screenshots.forEach(screenshot => {
      const screenshotPath = path.join(CONFIG.screenshotsDir, screenshot);
      archive.file(screenshotPath, { name: screenshot });
    });

    // Add description
    const descriptionPath = path.join(CONFIG.storeAssetsDir, 'description.txt');
    if (exists(descriptionPath)) {
      archive.file(descriptionPath, { name: 'description.txt' });
    }

    archive.finalize();
  });
}

/**
 * Generate publication checklist
 */
function generateChecklist() {
  const checklist = [];

  checklist.push('# 📋 Chrome Web Store Publication Checklist');
  checklist.push('');
  checklist.push('## Pre-Publication');
  checklist.push('- [ ] Run `npm run build` to create production build');
  checklist.push('- [ ] Run `npm run package` to create package.zip');
  checklist.push('- [ ] Run `npm run prepare-store` to validate assets');
  checklist.push('- [ ] Test extension locally in Chrome');
  checklist.push('');

  checklist.push('## Chrome Web Store Console');
  checklist.push('- [ ] Go to https://chrome.google.com/webstore/devconsole/');
  checklist.push('- [ ] Upload package.zip');
  checklist.push('- [ ] Copy description from store-assets/description.txt');
  checklist.push('- [ ] Upload screenshots from store-assets/screenshots/');
  checklist.push('- [ ] Set category to "Productivity"');
  checklist.push('- [ ] Add privacy policy URL (if applicable)');
  checklist.push('- [ ] Add support URL: https://github.com/fpoujol/comet-search-modifier/issues');
  checklist.push('');

  checklist.push('## Final Steps');
  checklist.push('- [ ] Review all information');
  checklist.push('- [ ] Submit for review');
  checklist.push('- [ ] Monitor publication status');
  checklist.push('');

  checklist.push('## Files Ready:');

  // Check package
  if (exists(CONFIG.packageFile)) {
    const sizeKB = getFileSizeKB(CONFIG.packageFile);
    checklist.push(`- ✅ package.zip (${sizeKB} KB)`);
  } else {
    checklist.push('- ❌ package.zip (missing - run npm run package)');
  }

  // Check description
  if (exists(path.join(CONFIG.storeAssetsDir, 'description.txt'))) {
    checklist.push('- ✅ description.txt');
  } else {
    checklist.push('- ❌ description.txt (missing)');
  }

  // Check screenshots
  if (exists(CONFIG.screenshotsDir)) {
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
    checklist.push(`- ${screenshots.length > 0 ? '✅' : '❌'} Screenshots (${screenshots.length} files)`);
    screenshots.forEach(screenshot => {
      const sizeKB = getFileSizeKB(path.join(CONFIG.screenshotsDir, screenshot));
      checklist.push(`  - ${screenshot} (${sizeKB} KB)`);
    });
  } else {
    checklist.push('- ❌ Screenshots directory (missing)');
  }

  return checklist.join('\n');
}

/**
 * Display publication instructions
 */
function showInstructions() {
  log('='.repeat(60));
  log('🎯 CHROME WEB STORE PUBLICATION READY');
  log('='.repeat(60));

  console.log('\n📦 Extension Package:');
  if (exists(CONFIG.packageFile)) {
    const sizeKB = getFileSizeKB(CONFIG.packageFile);
    console.log(`   ✅ package.zip (${sizeKB} KB)`);
  } else {
    console.log('   ❌ package.zip (run "npm run package" first)');
  }

  console.log('\n📝 Store Description:');
  const descriptionPath = path.join(CONFIG.storeAssetsDir, 'description.txt');
  if (exists(descriptionPath)) {
    console.log('   ✅ store-assets/description.txt');
    console.log('   📋 Copy and paste into Chrome Web Store description field');
  } else {
    console.log('   ❌ description.txt missing');
  }

  console.log('\n🖼️  Screenshots:');
  if (exists(CONFIG.screenshotsDir)) {
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
      .slice(0, 5);

    if (screenshots.length > 0) {
      console.log(`   ✅ ${screenshots.length} screenshot(s) ready`);
      screenshots.forEach(screenshot => {
        const sizeKB = getFileSizeKB(path.join(CONFIG.screenshotsDir, screenshot));
        console.log(`   📸 ${screenshot} (${sizeKB} KB)`);
      });
    } else {
      console.log('   ⚠️  No screenshots found');
    }
  } else {
    console.log('   ❌ Screenshots directory missing');
  }

  if (exists(CONFIG.storeAssetsZip)) {
    const sizeKB = getFileSizeKB(CONFIG.storeAssetsZip);
    console.log(`\n📦 Store assets package: store-assets.zip (${sizeKB} KB)`);
  }

  console.log('\n🔗 Next Steps:');
  console.log('   1. Go to https://chrome.google.com/webstore/devconsole/');
  console.log('   2. Upload package.zip');
  console.log('   3. Copy description from store-assets/description.txt');
  console.log('   4. Upload screenshots from store-assets/screenshots/');
  console.log('   5. Submit for review');

  log('='.repeat(60));
}

/**
 * Main function
 */
async function main() {
  try {
    log('🚀 Preparing Chrome Web Store assets...');

    // Validate store assets
    const { issues, warnings } = validateStoreAssets();

    // Show warnings
    warnings.forEach(warning => log(warning, 'warning'));

    // Check for critical issues
    if (issues.length > 0) {
      issues.forEach(issue => log(issue, 'error'));
      throw new Error('Critical issues found - fix them before continuing');
    }

    // Validate package
    const packageIssues = validatePackage();
    if (packageIssues.length > 0) {
      packageIssues.forEach(issue => log(issue, 'error'));
      throw new Error('Package validation failed');
    }

    // Create store assets ZIP
    await createStoreAssetsZip();

    // Generate and save checklist
    const checklist = generateChecklist();
    const checklistPath = path.join(CONFIG.storeAssetsDir, 'publication-checklist.md');
    fs.writeFileSync(checklistPath, checklist);
    log(`Checklist saved: ${checklistPath}`, 'success');

    // Show final instructions
    showInstructions();

    log('✅ Store preparation completed successfully!', 'success');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  validateStoreAssets,
  validatePackage,
  createStoreAssetsZip
};