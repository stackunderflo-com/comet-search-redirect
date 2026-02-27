# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension project for the Comet browser that intelligently modifies search behavior:
- **Single word searches** → Redirected to Google
- **Multi-word searches** → Stay on Perplexity AI (Comet's default search engine)

## Technical Architecture

### Extension Structure
The complete project structure follows Chrome Extension Manifest V3 with modern build tools:

```
comet-search-modifier/
├── src/                      # Source code
│   ├── background.js         # Main service worker
│   ├── content.js            # Script injected into Perplexity
│   ├── popup.html            # Extension popup interface
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── public/                   # Static resources
│   ├── manifest.json         # Extension configuration
│   └── icons/                # Extension icons
│       └── icon-128.png
├── dist/                     # Production build (generated)
├── scripts/                  # Build scripts
│   └── build.js              # Custom build script
├── test/                     # Tests
│   ├── background.test.js
│   └── content.test.js
├── store-assets/             # Chrome Web Store assets
├── visuals/                  # Screenshot templates
├── package.json              # npm dependencies and scripts
├── webpack.config.js         # Webpack configuration
├── jest.config.js            # Jest configuration
├── .eslintrc.json            # ESLint configuration
└── documentation files...
```

### Key Technical Challenges

1. **Perplexity AI SPA Navigation**: After `/b/home`, Perplexity uses JavaScript navigation (pushState/replaceState) that doesn't trigger Chrome's standard navigation events
2. **Security Policy Restrictions**: ExtensionsSettings policy blocks `chrome.scripting.executeScript`
3. **Complex URL Flow**:
   - New tab → `chrome://newtab/`
   - Redirect → `https://www.perplexity.ai/b/home`
   - Search → JavaScript URL changes (not detected by webNavigation)

### Technical Solutions

- **Primary approach**: Content script injection at `document_start`
- **Fallback**: Intelligent polling when SPA navigation is detected
- **Hybrid strategy**: Combine classic navigation listeners with content script monitoring

### Search Detection Logic

Single word detection criteria:
- No spaces, plus signs, or %20 (URL encoding)
- Hyphens count as multiple words (`machine-learning` = 2 words)
- Clean Perplexity identifiers: `query-XXXXX.XXXXX` format

### URL Patterns to Monitor

- Search parameters: `q`, `query`, `s`, `search`
- Perplexity search URLs: `/search/new?q=QUERY` then `/search/QUERY-IDENTIFIER`
- Pages to ignore: `/home`, `/b/home`, `/settings`, `/profile`, `/login`, `/signup`

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Production build
npm run build

# Build and package for Chrome Web Store
npm run package

# Clean build artifacts
npm run clean
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Lint and fix issues
npm run lint:fix
```

### Chrome Extension Development
1. **Load extension for testing**:
   - Run `npm run dev` for development build
   - Open `chrome://extensions/` in Comet browser
   - Enable "Developer mode"
   - Click "Load unpacked" and select `dist/` directory

2. **Debug extension**:
   - Background script: Inspect service worker in `chrome://extensions/`
   - Content script: Use browser DevTools on Perplexity.ai pages
   - Console logs prefixed with `[Comet]` for debugging

3. **Build for production**:
   - Run `npm run package` to create `package.zip`
   - Upload to Chrome Web Store Developer Dashboard

## Required Permissions

```json
{
  "permissions": [
    "tabs",
    "webNavigation"
  ],
  "host_permissions": [
    "*://www.perplexity.ai/*",
    "*://www.google.com/*"
  ]
}
```

## Testing Strategy

### Unit Tests (Jest)
- `background.test.js`: Service worker logic
- `content.test.js`: Content script functionality
- Word detection algorithm tests
- URL parsing and cleaning tests

### Integration Tests
- Chrome extension APIs mocking
- Navigation flow simulation
- Popup interface interactions

### Manual Testing Checklist
1. New tab → `/b/home` → single word search → should redirect to Google
2. Direct URL search → should work correctly
3. Browser navigation (back/forward) → should not create loops
4. Multiple tabs → each tab should work independently
5. Compound words with hyphens → should stay on Perplexity
6. Extension popup toggle functionality
7. Statistics counter accuracy

## Critical Implementation Notes

- Avoid redirect loops by checking current URL before redirecting
- Never use persistent cache for redirect state
- Use MutationObserver for SPA change detection
- Implement throttled polling as fallback (max 500ms intervals)
- Clean query parameters before word count analysis

## Chrome Web Store Publication

### Build for Store
```bash
npm run package  # Creates optimized package.zip
```

### Required Assets
- Extension icons (16x16, 32x32, 48x48, 128x128)
- Screenshots for store listing
- Privacy policy (PRIVACY.md)
- Detailed description and keywords

### Store Requirements
- Manifest V3 compliance
- Single purpose policy adherence
- Privacy disclosure for data usage
- Developer account ($5 one-time fee)

### Pre-submission Checklist
- [ ] Test on latest Chrome/Chromium
- [ ] Verify all permissions are necessary
- [ ] Review Chrome Web Store policies
- [ ] Complete store listing information
- [ ] Upload privacy policy
- [ ] Test installation from unpacked extension