# Privacy Policy - Comet Search Redirect

**Last updated: January 2025**

## Overview

The Comet Search Redirect extension respects your privacy. This privacy policy explains what information we collect, how we use it, and your rights regarding that data.

## Information collected

### Data processed locally

The extension processes the following information **only on your device**:

- **URLs visited**: Only Perplexity.ai URLs to detect searches
- **Search queries**: Search text to analyze whether it is one or more words
- **Usage statistics**: Number of redirects performed
- **Preferences**: Extension enabled/disabled state

### Data NOT collected

The extension **NEVER** collects:
- Personal or identifying data
- Complete browsing history
- Web page content
- Location information
- Login credentials or passwords

## Data usage

### Local processing only

All data is processed **locally on your device** to:
- Analyze search queries (single-word vs multi-word)
- Perform redirects to Google when necessary
- Display usage statistics in the interface
- Save your preferences

### No external transmission

The extension does **NOT** transmit any data to:
- External servers
- Analytics services
- Advertising networks
- Extension developers

## Data storage

### Chrome Storage API

The extension uses the Chrome Storage API to save:
- Enabled/disabled state: `boolean`
- Statistics: `{ totalRedirects: number, sessionRedirects: number, lastReset: timestamp }`

This data is synced with your Google Chrome account if sync is enabled in your browser.

### Temporary data

Some data is temporarily stored in memory:
- Current URL (for analysis)
- Active tab state
- Polling timers

This data is automatically deleted when the tab or browser is closed.

## Required permissions

### Permission justification

The extension requests the following permissions:

- **`tabs`**: Required to redirect tabs to Google
- **`webNavigation`**: Detects navigation on Perplexity.ai
- **`storage`**: Saves user preferences
- **`host_permissions` for perplexity.ai**: Content script injection
- **`host_permissions` for google.com**: Redirects to Google

### Minimal permissions

We follow the **principle of least privilege** and only request what is strictly necessary for operation.

## Security

### Protective measures

- **No external code**: All code is included in the extension
- **Content Security Policy**: Strict policy preventing unauthorized code execution
- **Input validation**: All URLs and queries are validated
- **No eval()**: No dynamic code evaluation

### Manifest V3

The extension uses Manifest V3, the most secure version of Chrome extensions with:
- Service Workers instead of persistent background pages
- More granular permissions
- Enhanced security

## User control

### Data management

You can at any time:
- **Disable the extension** via the popup
- **Reset statistics** via the reset button
- **Uninstall the extension** to delete all data

### Transparency

- Source code available on GitHub
- Debug interface with detailed information
- Console logs for development (can be disabled)

## Data sharing

### No sharing

The extension does **NOT** share any data with:
- Third parties
- Partners
- External services
- Other extensions

### Open source

The source code is publicly available for audit and verification.

## Compliance

### GDPR (Europe)

The extension is GDPR compliant because:
- No personal data is collected
- Local processing only
- Full user control
- Complete transparency

### CCPA (California)

Compliant with CCPA as no personal data is sold or shared.

## Changes

### Policy updates

This policy may be updated to reflect:
- Changes in the extension
- New regulations
- Security improvements

### Notification

Significant changes will be communicated via:
- Extension update
- Release notes
- GitHub repository

## Contact

### Support and questions

For any questions regarding this policy:
- [GitHub Issues](https://github.com/stackunderflo-com/comet-search-redirect/issues)
- Email: [contact via GitHub]

### Reporting issues

To report a privacy concern:
- Create a GitHub issue with the "privacy" tag
- Describe the issue in detail

## Summary

**In summary**: The Comet Search Redirect extension does not collect any personal data, processes everything locally, and fully respects your privacy. It works solely to improve your search experience in the Comet browser.

---

*This privacy policy is effective since January 2025 and applies to all versions of the Comet Search Redirect extension.*
