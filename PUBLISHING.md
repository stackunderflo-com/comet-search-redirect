# Publishing to Chrome Web Store

Complete guide for publishing and maintaining the Comet Search Redirect extension on the Chrome Web Store.

## Creating the Package

### Option 1: Automated Package (Recommended)

```bash
# Create the ZIP package ready for Chrome Web Store
npm run package
```

This command automatically generates:
- **Optimized production build**
- **Manifest and required files validation**
- **Placeholder icons** creation if missing
- **ZIP package** named `package.zip`

### Option 2: Manual Build

```bash
# Production build
npm run build

# Create ZIP manually
cd dist/
zip -r ../package.zip *
cd ..
```

## Chrome Web Store Description

### Short Description (132 characters max):
```
Smart search redirection for Comet browser - Single words go to Google, multi-word queries stay on Perplexity AI
```

### Detailed Description:
```
Comet Search Redirect - Smart Search Intelligence

Enhance your Comet browser experience with intelligent search redirection that understands your intent.

KEY FEATURES:
- Automatic single-word redirects to Google (e.g., "weather", "wikipedia", "amazon")
- Multi-word queries stay on Perplexity AI for complex answers
- Works seamlessly with Perplexity's SPA navigation
- Zero configuration required - works out of the box
- Real-time statistics tracking
- Debug mode for power users

WHY USE THIS EXTENSION?
- Get instant Google results for simple searches
- Keep Perplexity AI's power for complex questions
- Save time with automatic smart routing
- No manual switching between search engines

PERFECT FOR:
- Quick definition lookups -> Google
- Company/website searches -> Google
- Complex questions -> Perplexity AI
- Research queries -> Perplexity AI

PRIVACY FOCUSED:
- No data collection
- All processing happens locally
- No external servers
- Open source code

Simply install and let the extension intelligently route your searches to the right place!

Version 1.0.0 - Built for the Comet community
```

## Chrome Web Store Assets Management

### Store Assets Structure
All Chrome Web Store materials are organized in `store-assets/`:
```
store-assets/
├── description.txt          # Full store description (copy-paste ready)
├── store-listing.json       # All metadata and configuration
├── screenshots/             # Store your PNG screenshots here
└── publication-checklist.md # Auto-generated checklist
```

### Creating Screenshots

1. **Generate Visual Templates:**
   Navigate to the `visuals/` directory and open each HTML file in Chrome:
   ```bash
   start chrome "visuals/screenshot-1-hero.html"
   start chrome "visuals/screenshot-2-popup.html"
   start chrome "visuals/screenshot-3-examples.html"
   ```

2. **Capture Screenshots:**
   - Set browser to exactly 1280x800px
   - Press F11 for fullscreen mode
   - Use Windows Snipping Tool (Win+Shift+S)
   - Save as PNG to `store-assets/screenshots/`

3. **Naming Convention:**
   ```
   store-assets/screenshots/
   ├── screenshot-1-hero.png
   ├── screenshot-2-popup.png
   ├── screenshot-3-examples.png
   ├── screenshot-4-debug.png
   └── screenshot-5-comparison.png
   ```

### Automated Store Preparation

Use the preparation script to validate and organize everything:

```bash
# Prepare all store assets and validate
npm run prepare-store
```

This script will:
- Validate all store assets
- Check screenshot requirements
- Create `store-assets.zip` for easy upload
- Generate publication checklist
- Show copy-paste ready instructions

### Publication Workflow

#### 1. Build Extension Package
```bash
npm run build          # Create production build
npm run package        # Create package.zip (extension only)
```

**The package.zip contains ONLY:**
- Chrome extension (manifest, scripts, popup, 128px icon)

#### 2. Chrome Web Store Submission (2 steps)

**Step 1: Upload Extension**
1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
2. Upload `package.zip` (extension only)

**Step 2: Store Assets (Manual Upload)**
3. "Store Listing" tab -> Copy description from `store-assets/description.txt`
4. "Store Listing" tab -> Upload screenshots from `store-assets/screenshots/`
5. Complete category, language, etc.
6. Submit for review

**IMPORTANT:** Screenshots and long description are uploaded **MANUALLY** in the developer console, **NOT** in the package.zip

### File Structure

**package.zip (extension only):**
```
package.zip
├── manifest.json              # Extension configuration
├── background.js              # Service Worker
├── content.js                 # Content script
├── popup.html, popup.js       # Popup interface
└── icons/
    └── icon-128.png           # Extension icon
```

**store-assets/ (manual upload):**
```
store-assets/
├── description.txt            # Copy-paste into Store Listing
├── store-listing.json         # Reference metadata
└── screenshots/               # Upload into Store Listing
    ├── screenshot-1-hero.png      (1280x800px)
    ├── screenshot-2-popup.png     (1280x800px)
    ├── screenshot-3-examples.png  (1280x800px)
    ├── screenshot-4-debug.png     (1280x800px)
    └── screenshot-5-comparison.png (1280x800px)
```

**Requirements:**
- **Extension package:** Max 20MB
- **Screenshots:** 1-5 images, 1280x800px (manual upload)
- **Description:** Manual copy-paste from store-assets/
- **Category:** Productivity

### What does NOT work
- Including screenshots in package.zip
- Including long description in package.zip
- Automatic import of store assets

## Version Management

### Automatic Versioning

The project uses version management in `manifest.json`. To publish a new version:

#### 1. Update the version in manifest.json

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

### Version Types

- **Patch (x.x.1)**: Bug fixes, minor improvements
- **Minor (x.1.x)**: New backward-compatible features
- **Major (1.x.x)**: Breaking changes

## Chrome Web Store Publication

### Prerequisites

1. **Chrome Developer Account** ($5 one-time fee)
   - Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
   - Create a developer account

2. **Package ready**
   ```bash
   npm run package
   # Generates package.zip (~6-8 KB)
   ```

### Publication Steps

#### 1. First Publication

1. **Go to** [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
2. **Click** "Add new item"
3. **Upload** the `package.zip` file
4. **Complete** the information:

##### Basic Information
```
Title: Comet Search Redirect
Summary: Smart search redirection for Comet browser
Description: Intelligently redirects single-word searches to Google
while keeping multi-word searches on Perplexity AI in Comet browser.

Category: Productivity
Language: English
```

##### Required Assets
- **Icon 128x128**: `public/icons/icon-128.png`
- **Screenshots**: 1280x800 or 640x400 (max 5)
- **Promotional image**: 440x280 (optional)

##### Privacy and Permissions
- **Privacy policy**: Link to PRIVACY.md
- **Permissions justification**:
  - `tabs`: Required to redirect search tabs
  - `webNavigation`: Detect navigation on Perplexity.ai
  - `storage`: Save user preferences and statistics

#### 2. Review Submission

1. **Save** the draft
2. **Click** "Submit for review"
3. **Wait** for approval (typically 1-3 days)

### Updates

#### Publishing a New Version

```bash
# 1. Update the version
npm version patch

# 2. Create the new package
npm run package

# 3. Upload to Chrome Web Store
```

In the developer console:
1. **Select** your extension
2. **Click** "Package" in the menu
3. **Upload** the new `package.zip`
4. **Update** the changelog if needed
5. **Submit for review**

#### Changelog Template

```
Version 1.0.1 - Bug Fixes
- Fixed redirect detection on new Perplexity UI
- Improved performance for SPA navigation
- Updated debug mode interface

Version 1.1.0 - New Features
- Added statistics tracking
- Improved popup interface
- Enhanced debugging tools
```

## Recommended Release Workflow

### Complete Release Script

```bash
#!/bin/bash
# scripts/release.sh

VERSION_TYPE=$1
MESSAGE=$2

if [ -z "$VERSION_TYPE" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: ./scripts/release.sh <patch|minor|major> \"Release message\""
    exit 1
fi

echo "Starting release process..."

# 1. Tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed"
    exit 1
fi

# 2. Linting
echo "Running linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "Linting failed"
    exit 1
fi

# 3. Version bump
echo "Updating version..."
npm version $VERSION_TYPE -m "Release v%s: $MESSAGE"

# 4. Build & Package
echo "Building and packaging..."
npm run package

# 5. Git tag
NEW_VERSION=$(node -p "require('./package.json').version")
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION: $MESSAGE"

echo "Release v$NEW_VERSION ready!"
echo "Package: package.zip"
echo "Upload to: https://chrome.google.com/webstore/devconsole/"
```

Usage:
```bash
chmod +x scripts/release.sh
./scripts/release.sh patch "Fix navigation bugs"
```

## Post-Publication Monitoring

### Metrics to Monitor

1. **Chrome Web Store Console**
   - Number of installations
   - Ratings and reviews
   - Reported crashes

2. **Error Logs**
   - Monitor errors in reviews
   - Track GitHub issues

3. **User Feedback**
   - Respond to reviews
   - Address GitHub issues

### Pre-Publication Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] Version incremented
- [ ] CHANGELOG.md updated
- [ ] Screenshots updated if UI changed
- [ ] Privacy policy updated if needed
- [ ] Package tested locally

## Security and Compliance

### Important Points

1. **Minimal Permissions**
   - Only request necessary permissions
   - Justify each permission in the description

2. **No External Code**
   - All code must be included in the extension
   - No CDN or external scripts

3. **Privacy Policy**
   - Required even if no data is collected
   - Available in PRIVACY.md

4. **Content Security Policy**
   - Configured in manifest.json
   - No eval() or dynamic code

## Support and Issues

### Problem Management

1. **Chrome Web Store**
   - Respond to negative reviews
   - Propose solutions

2. **GitHub Issues**
   - Sort by priority
   - Labels: bug, feature, question

3. **Contact Support**
   - Email via GitHub profile
   - Do not share personal email publicly

## Store Optimization

### Improve Visibility

1. **Keywords in Description**
   - "search redirect"
   - "Perplexity Google"
   - "Comet browser"
   - "productivity"

2. **Quality Screenshots**
   - Show the popup interface
   - Before/after redirect
   - Settings and debug mode

3. **Detailed Description**
   - Clearly explain the functionality
   - Concrete use cases
   - User benefits

---

**Summary**: Use `npm run package` to create the ZIP, increment with `npm version`, then upload to Chrome Web Store Developer Console.
