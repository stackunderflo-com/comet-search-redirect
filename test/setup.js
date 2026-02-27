/**
 * Configuration Jest pour les tests de l'extension Chrome
 */

// Mock complet de l'API Chrome
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Comet Search Redirect'
    }))
  },

  tabs: {
    query: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
    onActivated: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn()
    }
  },

  webNavigation: {
    onBeforeNavigate: {
      addListener: jest.fn()
    }
  },

  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        callback({
          enabled: true,
          stats: {
            totalRedirects: 0,
            sessionRedirects: 0,
            lastReset: Date.now()
          }
        });
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      })
    }
  }
};

// Mock des APIs DOM spécifiques
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Mock de console pour les tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Helper pour créer des URLs de test
global.createTestUrl = (base, params = {}) => {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.href;
};

// Helper pour simuler les événements DOM
global.simulateEvent = (element, eventType, options = {}) => {
  const event = new Event(eventType, { bubbles: true, ...options });
  Object.assign(event, options);
  element.dispatchEvent(event);
  return event;
};

// Mock de window.location
delete window.location;
window.location = {
  href: 'https://www.perplexity.ai/',
  hostname: 'www.perplexity.ai',
  pathname: '/',
  search: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// Mock de history API
global.history = {
  pushState: jest.fn(),
  replaceState: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  go: jest.fn()
};

// Timeouts pour les tests asynchrones
jest.setTimeout(10000);

// Nettoyage entre les tests
beforeEach(() => {
  jest.clearAllMocks();

  // Reset window.location
  window.location.href = 'https://www.perplexity.ai/';
  window.location.search = '';
  window.location.pathname = '/';

  // Reset console
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
});

// Helper pour attendre les timers
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));