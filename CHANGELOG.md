# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Development and testing support
- Complete project documentation

## [1.0.0] - 2025-01-XX

### Added
- **Smart redirection**: Automatic single-word vs multi-word detection
- **Content Script**: Injection into Perplexity.ai to detect SPA navigations
- **Service Worker**: Background script for managing redirects
- **Popup interface**: On/off toggle, statistics, debug mode
- **Robust detection**: MutationObserver + smart polling for SPA
- **Manifest V3 support**: Latest Chrome extension version
- **Comprehensive tests**: Jest test suite with Chrome API mocking
- **Optimized build**: Webpack with production/development configuration
- **Chrome Store package**: Automated script for creating the .zip
- **Documentation**: README, PRIVACY, CHANGELOG, developer guides

### Main features
- Single-word searches → Redirect to Google
- Multi-word searches → Stay on Perplexity AI
- Hyphenated words treated as multi-word (`machine-learning`)
- Redirect statistics (total + session)
- Debug mode with detailed information
- Ignored pages: `/home`, `/b/home`, `/settings`, etc.

### Technical
- **Architecture**: Service Worker + Content Script + Popup
- **Permissions**: `tabs`, `webNavigation`, `storage`, host_permissions
- **Monitored URLs**: `/search/new?q=`, `/search/QUERY-ID`
- **Fallbacks**: Smart polling when navigation events fail
- **Security**: Strict CSP, no external code, minimal permissions

### Tests
- Unit tests for background.js and content.js
- Complete Chrome API mocking
- Code coverage > 70%
- Integration tests for complete scenarios

### Build and deployment
- Webpack 5 with production optimizations
- ESLint with Chrome Extensions rules
- Automated packaging script
- Manifest and assets validation

### Documentation
- Developer and user installation guide
- Complete privacy policy
- Detailed technical architecture
- Usage examples and tests

---

## Change types
- `Added` for new features
- `Changed` for changes to existing features
- `Deprecated` for features that will be removed soon
- `Removed` for removed features
- `Fixed` for bug fixes
- `Security` for fixed vulnerabilities
