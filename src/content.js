/**
 * Content Script for Comet Search Redirect extension
 * Injected into all Perplexity.ai pages to detect SPA navigation
 */

// Configuration
const CONFIG = {
  DEBUG: true,
  MUTATION_THROTTLE: 300,
  URL_CHECK_INTERVAL: 1000,
  GOOGLE_SEARCH_URL: 'https://www.google.com/search?q='
};

// Content script state
let lastUrl = window.location.href;
let lastCheckTime = 0;
let mutationThrottleTimer = null;
let urlCheckInterval = null;

/**
 * Logging function with prefix
 */
function log(...args) {
  if (CONFIG.DEBUG) {
    console.log('[Comet Content]', ...args);
  }
}

/**
 * Detects if a query is a single word
 */
function isOneWord(query) {
  if (!query || typeof query !== 'string') return false;

  const cleaned = decodeURIComponent(query).trim();
  return cleaned.length > 0 &&
         !cleaned.includes(' ') &&
         !cleaned.includes('+') &&
         !cleaned.includes('%20') &&
         !cleaned.includes('-') &&
         !cleaned.includes('_');
}

/**
 * Cleans Perplexity identifier from queries
 */
function cleanPerplexityQuery(query) {
  const cleanMatch = query.match(/^(.+?)[-_][a-zA-Z0-9]{5,}\.[a-zA-Z0-9]+$/);
  return cleanMatch ? cleanMatch[1] : query;
}

/**
 * Extracts search query from current URL
 */
function extractQueryFromUrl(url = window.location.href) {
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

    // Check path for URLs like /search/query-id
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
function shouldIgnoreUrl(url = window.location.href) {
  const ignorePaths = ['/home', '/b/home', '/settings', '/profile', '/login', '/signup', '/'];

  try {
    const urlObj = new URL(url);
    return ignorePaths.some(path => urlObj.pathname === path || urlObj.pathname.startsWith(path + '/'));
  } catch (e) {
    return true;
  }
}

/**
 * Performs redirection to Google
 */
function redirectToGoogle(query) {
  try {
    const googleUrl = CONFIG.GOOGLE_SEARCH_URL + encodeURIComponent(query);
    log(`Content script redirect: "${query}" -> ${googleUrl}`);

    // Immediate redirection
    window.location.href = googleUrl;
    return true;
  } catch (error) {
    log('Content script redirection error:', error);
    return false;
  }
}

/**
 * Analyzes current URL and performs redirection if necessary
 */
function analyzeCurrentUrl() {
  const currentUrl = window.location.href;

  // Avoid too frequent analyses
  const now = Date.now();
  if (now - lastCheckTime < CONFIG.MUTATION_THROTTLE) {
    return false;
  }
  lastCheckTime = now;

  if (shouldIgnoreUrl(currentUrl)) {
    log('URL ignored:', currentUrl);
    return false;
  }

  const query = extractQueryFromUrl(currentUrl);
  if (!query) {
    log('No query found in:', currentUrl);
    return false;
  }

  log('Query extracted:', query, 'from URL:', currentUrl);

  if (isOneWord(query)) {
    log('Single word detected in content script:', query);
    redirectToGoogle(query);
    return true;
  } else {
    log('Multi-word detected:', query, '-> stays on Perplexity');
    return false;
  }
}

/**
 * URL change handler with throttling
 */
function handleUrlChange() {
  if (mutationThrottleTimer) {
    clearTimeout(mutationThrottleTimer);
  }

  mutationThrottleTimer = setTimeout(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      log('URL change detected:', lastUrl, '->', currentUrl);
      lastUrl = currentUrl;
      analyzeCurrentUrl();
    }
  }, CONFIG.MUTATION_THROTTLE);
}

/**
 * Observer to detect DOM and URL changes
 */
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    for (const mutation of mutations) {
      // Check changes in elements that might indicate navigation
      if (mutation.type === 'childList') {
        // Look for Perplexity-specific elements that change during navigation
        const hasSearchElements = mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              return node.querySelector && (
                node.querySelector('[data-testid*="search"]') ||
                node.querySelector('[class*="search"]') ||
                node.matches('[data-testid*="search"]') ||
                node.matches('[class*="search"]')
              );
            }
            return false;
          });

        if (hasSearchElements) {
          shouldCheck = true;
          break;
        }
      }
    }

    if (shouldCheck) {
      handleUrlChange();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false
  });

  log('MutationObserver configured');
  return observer;
}

/**
 * Periodic URL checking as fallback
 */
function setupUrlPolling() {
  urlCheckInterval = setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      log('URL change detected by polling:', currentUrl);
      lastUrl = currentUrl;
      analyzeCurrentUrl();
    }
  }, CONFIG.URL_CHECK_INTERVAL);

  log('URL polling configured');
}

/**
 * Content script initialization
 */
function initialize() {
  log('Content script initialized on:', window.location.href);

  // Immediate URL analysis
  analyzeCurrentUrl();

  // Configure change detection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupMutationObserver();
      setupUrlPolling();
    });
  } else {
    setupMutationObserver();
    setupUrlPolling();
  }

  // Listen for JavaScript navigation events
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    log('pushState detected');
    setTimeout(handleUrlChange, 100);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    log('replaceState detected');
    setTimeout(handleUrlChange, 100);
  };

  // Listen for popstate event (back/forward navigation)
  window.addEventListener('popstate', () => {
    log('popstate detected');
    handleUrlChange();
  });
}

/**
 * Cleanup before page unload
 */
window.addEventListener('beforeunload', () => {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval);
  }
  if (mutationThrottleTimer) {
    clearTimeout(mutationThrottleTimer);
  }
});

// Start initialization
initialize();
