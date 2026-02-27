# Comet Search Redirect

Chrome extension for the **Comet** browser that intelligently redirects single-word searches to Google while keeping multi-word searches on Perplexity AI.

## Features

- **Smart redirection**: Single-word searches are automatically redirected to Google
- **Multi-word on Perplexity**: Multi-word searches stay on Perplexity AI
- **User interface**: Popup with on/off toggle and statistics
- **Debug mode**: Detailed information for development
- **Statistics**: Redirect count tracking

## Installation

### For developers

1. **Clone the repository**
   ```bash
   git clone https://github.com/fpoujol/comet-search-modifier.git
   cd comet-search-modifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development build**
   ```bash
   npm run dev
   ```

4. **Load in Comet**
   - Open `chrome://extensions/` in Comet
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### For end users

1. Download from the Chrome Web Store (coming soon)
2. Or download the `.zip` file from the [releases](https://github.com/fpoujol/comet-search-modifier/releases)

## Development

### Available commands

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Tests
npm run test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Package for Chrome Web Store
npm run package

# Clean build artifacts
npm run clean
```

### Project structure

```
comet-search-modifier/
├── src/                  # Source code
│   ├── background.js     # Service worker
│   ├── content.js        # Injected script
│   ├── popup.html        # Popup interface
│   ├── popup.js          # Popup logic
│   └── popup.css         # Popup styles
├── public/               # Static resources
│   ├── manifest.json     # Extension configuration
│   └── icons/            # Extension icons
├── test/                 # Tests
├── scripts/              # Build scripts
└── dist/                 # Build output (generated)
```

## Tests

The extension includes a comprehensive test suite:

```bash
# All tests
npm test

# Tests with coverage
npm run test:coverage

# Tests in watch mode
npm run test:watch
```

Tests cover:
- Single vs multi-word detection
- Query extraction from URLs
- Redirect logic
- Chrome API interactions

## How it works

### Search detection

The extension analyzes Perplexity URLs to detect:
- **Single word**: `python`, `javascript`, `test`
- **Multi-word**: `hello world`, `machine learning`, `how to code`
- **Hyphenated words**: `machine-learning` (treated as multi-word)

### SPA navigation

Perplexity uses a Single Page Application that doesn't trigger standard navigation events. The extension uses:
- **Content Script**: Injected into all Perplexity pages
- **MutationObserver**: Detects DOM changes
- **Smart polling**: Fallback to capture all changes

### Monitored URLs

- `/search/new?q=QUERY`
- `/search/QUERY-IDENTIFIER`
- Parameters: `q`, `query`, `s`, `search`

## Configuration

### Manifest V3

The extension uses Manifest V3 with minimal permissions:
- `tabs`: Tab access for redirection
- `webNavigation`: Navigation detection
- `storage`: Preference saving
- `host_permissions`: Access to Perplexity and Google

### Security

- No remote code execution
- Minimal permissions required
- No personal data collection
- Strict Content Security Policy

## Statistics

The extension tracks:
- Total number of redirects
- Redirects per session
- Last action performed

## Debug

Debug mode available in the popup with:
- Current tab URL
- Last action
- Version information
- Redirect test

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments

- [Comet Browser](https://comet.com) for the inspiration
- [Perplexity AI](https://perplexity.ai) for the search engine
- Chrome Extensions community for the documentation

## Support

- [GitHub Issues](https://github.com/stackunderflo-com/comet-search-redirect/issues)


---

**Note**: This extension is specifically designed for the Comet browser and its integration with Perplexity AI.
