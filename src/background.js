/**
 * Service Worker for Comet Search Redirect extension
 * Handles main search redirection logic
 */

// Configuration
const CONFIG = {
  DEBUG: true,
  POLLING_INTERVAL: 500,
  GOOGLE_SEARCH_URL: 'https://www.google.com/search?q=',
  PERPLEXITY_DOMAIN: 'www.perplexity.ai',
  REDIRECT_DELAY: 100
};

// Global extension state
let extensionEnabled = true;
const pollingIntervals = new Map(); // tabId -> intervalId
let redirectStats = {
  totalRedirects: 0,
  sessionRedirects: 0,
  lastReset: Date.now()
};

/**
 * Extension initialization
 */
chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed/updated');

  // Load saved settings
  chrome.storage.sync.get(['enabled', 'stats'], (result) => {
    extensionEnabled = result.enabled !== false; // enabled by default
    if (result.stats) {
      redirectStats = { ...redirectStats, ...result.stats };
    }
    log('Settings loaded:', { extensionEnabled, redirectStats });
  });
});

/**
 * Logging function with prefix
 */
function log(...args) {
  if (CONFIG.DEBUG) {
    console.log('[Comet Background]', ...args);
  }
}

/**
 * Detects if a query is a single word
 */
function isOneWord(query) {
  if (!query || typeof query !== 'string') return false;

  const cleaned = decodeURIComponent(query).trim();

  // Checks for single word
  return cleaned.length > 0 &&
         !cleaned.includes(' ') &&
         !cleaned.includes('+') &&
         !cleaned.includes('%20') &&
         !cleaned.includes('-') && // hyphens = multiple words
         !cleaned.includes('_');
}

/**
 * Cleans Perplexity identifier from URLs
 * Format: query-XXXXX.XXXXX -> query
 */
function cleanPerplexityQuery(query) {
  // Clean auto-generated Perplexity identifier
  const cleanMatch = query.match(/^(.+?)[-_][a-zA-Z0-9]{5,}\.[a-zA-Z0-9]+$/);
  return cleanMatch ? cleanMatch[1] : query;
}

/**
 * Extracts search query from URL
 */
function extractQuery(url) {
  try {
    const urlObj = new URL(url);

    // Possible search parameters
    const searchParams = ['q', 'query', 's', 'search'];

    for (const param of searchParams) {
      const value = urlObj.searchParams.get(param);
      if (value) {
        return cleanPerplexityQuery(value);
      }
    }

    // Check path for Perplexity URLs like /search/query-id
    const pathMatch = urlObj.pathname.match(/^\/search\/(.+?)(?:[-_][a-zA-Z0-9]{5,}\.[a-zA-Z0-9]+)?$/);
    if (pathMatch) {
      return cleanPerplexityQuery(pathMatch[1]);
    }

    return null;
  } catch (e) {
    log('Query extraction error:', e);
    return null;
  }
}

/**
 * Checks if URL should be ignored
 */
function shouldIgnoreUrl(url) {
  const ignorePaths = ['/home', '/b/home', '/settings', '/profile', '/login', '/signup', '/'];

  try {
    const urlObj = new URL(url);
    return ignorePaths.some(path => urlObj.pathname === path);
  } catch (e) {
    return true;
  }
}

/**
 * Performs redirection to Google
 */
async function redirectToGoogle(tabId, query) {
  if (!extensionEnabled) return false;

  try {
    const googleUrl = CONFIG.GOOGLE_SEARCH_URL + encodeURIComponent(query);
    log(`Redirecting tab ${tabId}: "${query}" -> ${googleUrl}`);

    await chrome.tabs.update(tabId, { url: googleUrl });

    // Update statistics
    redirectStats.totalRedirects++;
    redirectStats.sessionRedirects++;
    await chrome.storage.sync.set({ stats: redirectStats });

    // Notify popup if open
    chrome.runtime.sendMessage({
      type: 'redirect_performed',
      query,
      stats: redirectStats
    }).catch(() => {}); // Ignore if popup closed

    return true;
  } catch (error) {
    log('Redirection error:', error);
    return false;
  }
}

/**
 * Analyzes URL and performs redirection if necessary
 */
async function analyzeAndRedirect(tabId, url) {
  if (!extensionEnabled || !url.includes(CONFIG.PERPLEXITY_DOMAIN)) {
    return false;
  }

  if (shouldIgnoreUrl(url)) {
    log('URL ignored:', url);
    return false;
  }

  const query = extractQuery(url);
  if (!query) {
    log('No query found in:', url);
    return false;
  }

  log('Query extracted:', query, 'from URL:', url);

  if (isOneWord(query)) {
    log('Single word detected:', query);
    // Small delay to avoid navigation conflicts
    setTimeout(() => redirectToGoogle(tabId, query), CONFIG.REDIRECT_DELAY);
    return true;
  } else {
    log('Multi-word detected:', query, '-> stays on Perplexity');
    return false;
  }
}

/**
 * Smart polling to detect SPA changes
 */
function startPolling(tabId) {
  if (pollingIntervals.has(tabId)) {
    clearInterval(pollingIntervals.get(tabId));
  }

  const intervalId = setInterval(async() => {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        await analyzeAndRedirect(tabId, tab.url);
      }
    } catch (error) {
      log('Polling error for tab', tabId, ':', error);
      clearInterval(intervalId);
      pollingIntervals.delete(tabId);
    }
  }, CONFIG.POLLING_INTERVAL);

  pollingIntervals.set(tabId, intervalId);
  log('Polling started for tab', tabId);
}

/**
 * Stops polling for a tab
 */
function stopPolling(tabId) {
  if (pollingIntervals.has(tabId)) {
    clearInterval(pollingIntervals.get(tabId));
    pollingIntervals.delete(tabId);
    log('Polling stopped for tab', tabId);
  }
}

/**
 * Navigation events handling
 */
chrome.webNavigation.onBeforeNavigate.addListener(async(details) => {
  if (details.frameId !== 0) return; // Ignore iframes

  log('Navigation detected:', details.url);
  await analyzeAndRedirect(details.tabId, details.url);
});

/**
 * Active tab changes handling
 */
chrome.tabs.onActivated.addListener(async(activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes(CONFIG.PERPLEXITY_DOMAIN)) {
      // Analyze immediately then start polling
      await analyzeAndRedirect(activeInfo.tabId, tab.url);
      startPolling(activeInfo.tabId);
    }
  } catch (error) {
    log('Tab change error:', error);
  }
});

/**
 * Tab updates handling
 */
chrome.tabs.onUpdated.addListener(async(tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes(CONFIG.PERPLEXITY_DOMAIN)) {
      await analyzeAndRedirect(tabId, tab.url);
      if (tab.url.includes('/b/home')) {
        // Start polling after reaching home page
        startPolling(tabId);
      }
    } else {
      // Stop polling if leaving Perplexity
      stopPolling(tabId);
    }
  }
});

/**
 * Cleanup when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  stopPolling(tabId);
});

/**
 * Communication with popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
  case 'get_status':
    sendResponse({
      enabled: extensionEnabled,
      stats: redirectStats
    });
    break;

  case 'toggle_extension':
    extensionEnabled = message.enabled;
    chrome.storage.sync.set({ enabled: extensionEnabled });
    log('Extension', extensionEnabled ? 'enabled' : 'disabled');
    sendResponse({ success: true, enabled: extensionEnabled });
    break;

  case 'reset_stats':
    redirectStats.sessionRedirects = 0;
    redirectStats.lastReset = Date.now();
    chrome.storage.sync.set({ stats: redirectStats });
    sendResponse({ success: true, stats: redirectStats });
    break;

  default:
    sendResponse({ error: 'Unknown message type' });
  }
});

log('Service Worker started');
