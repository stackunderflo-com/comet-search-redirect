/**
 * JavaScript for the Comet Search Redirect extension popup
 */

// DOM elements
let elements = {};

// Interface state
const state = {
  enabled: true,
  stats: {
    totalRedirects: 0,
    sessionRedirects: 0,
    lastReset: Date.now()
  },
  debugExpanded: false
};

/**
 * Interface initialization
 */
document.addEventListener('DOMContentLoaded', async() => {
  // Get all DOM elements
  elements = {
    enableToggle: document.getElementById('enableToggle'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    totalRedirects: document.getElementById('totalRedirects'),
    sessionRedirects: document.getElementById('sessionRedirects'),
    resetStats: document.getElementById('resetStats'),
    debugToggle: document.getElementById('debugToggle'),
    debugContent: document.getElementById('debugContent'),
    currentUrl: document.getElementById('currentUrl'),
    lastAction: document.getElementById('lastAction'),
    versionInfo: document.getElementById('versionInfo'),
    testRedirect: document.getElementById('testRedirect'),
    helpLink: document.getElementById('helpLink'),
    feedbackLink: document.getElementById('feedbackLink'),
    loadingOverlay: document.getElementById('loadingOverlay')
  };

  // Load initial state
  await loadInitialState();

  // Set up event listeners
  setupEventListeners();

  // Update the interface
  updateUI();

  // Get the current tab URL for debug
  updateCurrentTabInfo();

  log('Popup initialized');
});

/**
 * Logging function
 */
function log(...args) {
  console.log('[Comet Popup]', ...args);
}

/**
 * Shows/hides the loading overlay
 */
function showLoading(show = true) {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.toggle('visible', show);
  }
}

/**
 * Loads the initial state from the background script
 */
async function loadInitialState() {
  try {
    showLoading(true);

    const response = await chrome.runtime.sendMessage({ type: 'get_status' });

    if (response) {
      state.enabled = response.enabled !== false;
      if (response.stats) {
        state.stats = { ...state.stats, ...response.stats };
      }
    }

    log('Initial state loaded:', state);
  } catch (error) {
    log('Initial state loading error:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
  // Main toggle
  elements.enableToggle?.addEventListener('change', handleToggleChange);

  // Reset statistics button
  elements.resetStats?.addEventListener('click', handleResetStats);

  // Debug toggle
  elements.debugToggle?.addEventListener('click', handleDebugToggle);

  // Test redirect button
  elements.testRedirect?.addEventListener('click', handleTestRedirect);

  // Footer links
  elements.helpLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/fpoujol/comet-search-modifier#readme'
    });
  });

  elements.feedbackLink?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/fpoujol/comet-search-modifier/issues'
    });
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'redirect_performed') {
      handleRedirectNotification(message);
    }
  });
}

/**
 * Handles main toggle change
 */
async function handleToggleChange(event) {
  try {
    showLoading(true);

    const enabled = event.target.checked;
    const response = await chrome.runtime.sendMessage({
      type: 'toggle_extension',
      enabled
    });

    if (response.success) {
      state.enabled = enabled;
      updateUI();
      updateLastAction(enabled ? 'Extension enabled' : 'Extension disabled');
      log('Toggle changed:', enabled);
    } else {
      // Revert toggle on error
      event.target.checked = state.enabled;
    }
  } catch (error) {
    log('Toggle error:', error);
    event.target.checked = state.enabled;
  } finally {
    showLoading(false);
  }
}

/**
 * Handles statistics reset
 */
async function handleResetStats() {
  try {
    showLoading(true);

    const response = await chrome.runtime.sendMessage({ type: 'reset_stats' });

    if (response.success) {
      state.stats = response.stats;
      updateUI();
      updateLastAction('Stats reset');

      // Feedback animation
      animateStatUpdate();
      log('Stats reset');
    }
  } catch (error) {
    log('Reset stats error:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * Handles debug section open/close
 */
function handleDebugToggle() {
  state.debugExpanded = !state.debugExpanded;

  elements.debugToggle?.classList.toggle('expanded', state.debugExpanded);
  elements.debugContent?.classList.toggle('expanded', state.debugExpanded);

  log('Debug section', state.debugExpanded ? 'opened' : 'closed');
}

/**
 * Redirect test for debug
 */
async function handleTestRedirect() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      const testUrl = 'https://www.perplexity.ai/search/new?q=test';
      await chrome.tabs.update(tab.id, { url: testUrl });
      updateLastAction('Redirect test started');
      log('Test redirection:', testUrl);
    }
  } catch (error) {
    log('Redirect test error:', error);
    updateLastAction('Redirect test error');
  }
}

/**
 * Updates the user interface
 */
function updateUI() {
  // Main toggle
  if (elements.enableToggle) {
    elements.enableToggle.checked = state.enabled;
  }

  // Status indicator
  if (elements.statusDot) {
    elements.statusDot.classList.toggle('disabled', !state.enabled);
  }
  if (elements.statusText) {
    elements.statusText.textContent = state.enabled ? 'Enabled' : 'Disabled';
  }

  // Statistics
  if (elements.totalRedirects) {
    elements.totalRedirects.textContent = state.stats.totalRedirects || 0;
  }
  if (elements.sessionRedirects) {
    elements.sessionRedirects.textContent = state.stats.sessionRedirects || 0;
  }

  // Version info
  if (elements.versionInfo) {
    const manifest = chrome.runtime.getManifest();
    elements.versionInfo.textContent = manifest.version;
  }

  // Container visual state
  document.body.classList.toggle('disabled', !state.enabled);
}

/**
 * Updates the current tab info for debug
 */
async function updateCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && elements.currentUrl) {
      const url = new URL(tab.url);
      elements.currentUrl.textContent = url.hostname + url.pathname;
      elements.currentUrl.title = tab.url; // Tooltip with full URL
    }
  } catch (error) {
    log('Tab info retrieval error:', error);
    if (elements.currentUrl) {
      elements.currentUrl.textContent = 'Unavailable';
    }
  }
}

/**
 * Updates the most recent action
 */
function updateLastAction(action) {
  if (elements.lastAction) {
    elements.lastAction.textContent = action;

    // Fade in/out effect
    elements.lastAction.style.opacity = '0.5';
    setTimeout(() => {
      if (elements.lastAction) {
        elements.lastAction.style.opacity = '1';
      }
    }, 100);
  }
}

/**
 * Statistics update animation
 */
function animateStatUpdate() {
  [elements.totalRedirects, elements.sessionRedirects].forEach(el => {
    if (el) {
      el.classList.add('updated');
      setTimeout(() => {
        el.classList.remove('updated');
      }, 600);
    }
  });
}

/**
 * Handles redirect notifications from the background
 */
function handleRedirectNotification(message) {
  if (message.stats) {
    state.stats = message.stats;
    updateUI();
    animateStatUpdate();
    updateLastAction(`Redirected: "${message.query}"`);
    log('Redirect notified:', message.query);
  }
}

/**
 * Global error handling
 */
window.addEventListener('error', (event) => {
  log('Popup error:', event.error);
  updateLastAction('Interface error');
});

/**
 * Cleanup before closing
 */
window.addEventListener('beforeunload', () => {
  log('Popup closed');
});
