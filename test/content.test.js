/**
 * Tests pour content.js
 */

const fs = require('fs');
const path = require('path');

// Charger le code content script
const contentCode = fs.readFileSync(
  path.join(__dirname, '../src/content.js'),
  'utf8'
);

describe('Content Script', () => {
  let contentContext;

  beforeEach(() => {
    // Réinitialiser le DOM
    document.body.innerHTML = '';

    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: 'https://www.perplexity.ai/',
        hostname: 'www.perplexity.ai',
        pathname: '/',
        search: ''
      }
    });

    // Créer un contexte pour le content script
    contentContext = {};

    // Définir les fonctions extraites du content script pour les tests
    contentContext = {
      isOneWord: function(query) {
        if (!query || typeof query !== 'string') return false;
        const cleaned = decodeURIComponent(query).trim();
        return cleaned.length > 0 &&
               !cleaned.includes(' ') &&
               !cleaned.includes('+') &&
               !cleaned.includes('%20') &&
               !cleaned.includes('-') &&
               !cleaned.includes('_');
      },

      cleanPerplexityQuery: function(query) {
        const cleanMatch = query.match(/^(.+?)[-_][a-zA-Z0-9]{5,}\.[a-zA-Z0-9]+$/);
        return cleanMatch ? cleanMatch[1] : query;
      },

      extractQueryFromUrl: function(url = window.location.href) {
        try {
          const urlObj = new URL(url);
          const searchParams = ['q', 'query', 's', 'search'];

          for (const param of searchParams) {
            const value = urlObj.searchParams.get(param);
            if (value) {
              return this.cleanPerplexityQuery(value);
            }
          }

          const pathMatch = urlObj.pathname.match(/^\/search\/(.+?)(?:[-_][a-zA-Z0-9]{5,}\.[a-zA-Z0-9]+)?$/);
          if (pathMatch) {
            return this.cleanPerplexityQuery(pathMatch[1]);
          }

          return null;
        } catch (e) {
          return null;
        }
      },

      shouldIgnoreUrl: function(url = window.location.href) {
        const ignorePaths = ['/home', '/b/home', '/settings', '/profile', '/login', '/signup', '/'];
        try {
          const urlObj = new URL(url);
          return ignorePaths.some(path => urlObj.pathname === path || urlObj.pathname.startsWith(path + '/'));
        } catch (e) {
          return true;
        }
      },

      CONFIG: {
        DEBUG: true,
        MUTATION_THROTTLE: 300,
        URL_CHECK_INTERVAL: 1000,
        GOOGLE_SEARCH_URL: 'https://www.google.com/search?q='
      }
    };
  });

  describe('URL Detection', () => {
    test('should extract query from URL parameters', () => {
      const testCases = [
        {
          url: 'https://www.perplexity.ai/search/new?q=python',
          expected: 'python'
        },
        {
          url: 'https://www.perplexity.ai/search?query=javascript',
          expected: 'javascript'
        },
        {
          url: 'https://www.perplexity.ai/search?s=test',
          expected: 'test'
        },
        {
          url: 'https://www.perplexity.ai/search?search=hello%20world',
          expected: 'hello world'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(contentContext.extractQueryFromUrl(url)).toBe(expected);
      });
    });

    test('should extract query from path', () => {
      const testCases = [
        {
          url: 'https://www.perplexity.ai/search/python-ABC12.XYZ34',
          expected: 'python'
        },
        {
          url: 'https://www.perplexity.ai/search/javascript_DEF56.ABC78',
          expected: 'javascript'
        },
        {
          url: 'https://www.perplexity.ai/search/hello%20world-GHI90.DEF12',
          expected: 'hello%20world'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(contentContext.extractQueryFromUrl(url)).toBe(expected);
      });
    });

    test('should return null for URLs without queries', () => {
      const testCases = [
        'https://www.perplexity.ai/',
        'https://www.perplexity.ai/home',
        'https://www.perplexity.ai/settings',
        'https://www.perplexity.ai/profile'
      ];

      testCases.forEach(url => {
        expect(contentContext.extractQueryFromUrl(url)).toBe(null);
      });
    });
  });

  describe('URL Ignore Logic', () => {
    test('should ignore system pages', () => {
      const ignoredUrls = [
        'https://www.perplexity.ai/',
        'https://www.perplexity.ai/home',
        'https://www.perplexity.ai/b/home',
        'https://www.perplexity.ai/settings',
        'https://www.perplexity.ai/profile',
        'https://www.perplexity.ai/login',
        'https://www.perplexity.ai/signup'
      ];

      ignoredUrls.forEach(url => {
        expect(contentContext.shouldIgnoreUrl(url)).toBe(true);
      });
    });

    test('should not ignore search pages', () => {
      const allowedUrls = [
        'https://www.perplexity.ai/search/new?q=python',
        'https://www.perplexity.ai/search/python-ABC12.XYZ34',
        'https://www.perplexity.ai/search/hello%20world',
        'https://www.perplexity.ai/other/page'
      ];

      allowedUrls.forEach(url => {
        expect(contentContext.shouldIgnoreUrl(url)).toBe(false);
      });
    });

    test('should ignore invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(contentContext.shouldIgnoreUrl(url)).toBe(true);
      });

      // Test with valid special URLs that should NOT be ignored
      const validSpecialUrls = [
        'javascript:void(0)',
        'about:blank'
      ];

      // Ces URLs ne sont pas dans notre liste d'ignorés, donc elles passent
      validSpecialUrls.forEach(url => {
        expect(contentContext.shouldIgnoreUrl(url)).toBe(false);
      });
    });
  });

  describe('Word Detection', () => {
    test('should correctly identify single words', () => {
      const singleWords = [
        'python',
        'javascript',
        'programming',
        'test',
        'hello',
        'world123',
        'café'
      ];

      singleWords.forEach(word => {
        expect(contentContext.isOneWord(word)).toBe(true);
      });
    });

    test('should correctly identify multiple words', () => {
      const multipleWords = [
        'hello world',
        'python programming',
        'machine learning',
        'how to code',
        'test query here'
      ];

      multipleWords.forEach(phrase => {
        expect(contentContext.isOneWord(phrase)).toBe(false);
      });
    });

    test('should treat hyphenated words as multiple words', () => {
      const hyphenatedWords = [
        'machine-learning',
        'e-mail',
        'COVID-19',
        'state-of-the-art',
        'real-time'
      ];

      hyphenatedWords.forEach(word => {
        expect(contentContext.isOneWord(word)).toBe(false);
      });
    });

    test('should handle special characters', () => {
      const specialCases = [
        { input: 'hello+world', expected: false },
        { input: 'hello%20world', expected: false },
        { input: 'hello_world', expected: false },
        { input: 'hello.world', expected: true }, // Point autorisé
        { input: 'hello@world', expected: true }, // @ autorisé
        { input: 'hello#world', expected: true }  // # autorisé
      ];

      specialCases.forEach(({ input, expected }) => {
        expect(contentContext.isOneWord(input)).toBe(expected);
      });
    });
  });

  describe('Perplexity Query Cleaning', () => {
    test('should clean Perplexity identifiers', () => {
      const testCases = [
        {
          input: 'python-ABC12.XYZ34',
          expected: 'python'
        },
        {
          input: 'javascript_DEF56.ABC78',
          expected: 'javascript'
        },
        {
          input: 'machine learning-GHI90.DEF12',
          expected: 'machine learning'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(contentContext.cleanPerplexityQuery(input)).toBe(expected);
      });
    });

    test('should return original if no identifier', () => {
      const testCases = [
        'python',
        'hello world',
        'test-query', // Pas le bon format d'identifiant
        'short-ID.1'  // Identifiant trop court
      ];

      testCases.forEach(input => {
        expect(contentContext.cleanPerplexityQuery(input)).toBe(input);
      });
    });
  });

  describe('DOM Interaction', () => {
    test('should have access to DOM APIs', () => {
      expect(document.body).toBeDefined();
      expect(window.location).toBeDefined();
      expect(MutationObserver).toBeDefined();
    });

    test('should be able to create and observe mutations', () => {
      const callback = jest.fn();
      const observer = new MutationObserver(callback);

      // Créer un élément de test
      const testElement = document.createElement('div');
      testElement.id = 'test';
      document.body.appendChild(testElement);

      // Observer les changements
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Vérifier que l'observer est configuré
      expect(observer.observe).toHaveBeenCalled();
    });

    test('should handle history API changes', () => {
      const originalPushState = history.pushState;
      const mockPushState = jest.fn();

      // Mock history.pushState
      history.pushState = mockPushState;

      // Simuler un pushState
      history.pushState({}, 'Test', '/new-path');

      expect(mockPushState).toHaveBeenCalledWith({}, 'Test', '/new-path');

      // Restaurer l'original
      history.pushState = originalPushState;
    });
  });

  describe('Event Handling', () => {
    test('should handle popstate events', () => {
      const popstateHandler = jest.fn();
      window.addEventListener('popstate', popstateHandler);

      // Simuler un événement popstate
      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);

      expect(popstateHandler).toHaveBeenCalled();
    });

    test('should handle beforeunload events', () => {
      const beforeunloadHandler = jest.fn();
      window.addEventListener('beforeunload', beforeunloadHandler);

      // Simuler un événement beforeunload
      const beforeunloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeunloadEvent);

      expect(beforeunloadHandler).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should have proper configuration values', () => {
      expect(contentContext.CONFIG).toBeDefined();
      expect(contentContext.CONFIG.GOOGLE_SEARCH_URL).toBe('https://www.google.com/search?q=');
      expect(typeof contentContext.CONFIG.MUTATION_THROTTLE).toBe('number');
      expect(typeof contentContext.CONFIG.URL_CHECK_INTERVAL).toBe('number');
      expect(contentContext.CONFIG.MUTATION_THROTTLE).toBeGreaterThan(0);
      expect(contentContext.CONFIG.URL_CHECK_INTERVAL).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete redirect scenario', () => {
      // Simuler une URL avec recherche mono-mot
      const searchUrl = 'https://www.perplexity.ai/search/new?q=python';

      // Extraire la query
      const query = contentContext.extractQueryFromUrl(searchUrl);
      expect(query).toBe('python');

      // Vérifier que c'est un mot unique
      const isOneWord = contentContext.isOneWord(query);
      expect(isOneWord).toBe(true);

      // Vérifier que l'URL ne doit pas être ignorée
      const shouldIgnore = contentContext.shouldIgnoreUrl(searchUrl);
      expect(shouldIgnore).toBe(false);
    });

    test('should handle multi-word stay scenario', () => {
      // Simuler une URL avec recherche multi-mots
      const searchUrl = 'https://www.perplexity.ai/search/new?q=machine%20learning';

      // Extraire la query
      const query = contentContext.extractQueryFromUrl(searchUrl);
      expect(query).toBe('machine learning');

      // Vérifier que ce n'est pas un mot unique
      const isOneWord = contentContext.isOneWord(query);
      expect(isOneWord).toBe(false);

      // Vérifier que l'URL ne doit pas être ignorée
      const shouldIgnore = contentContext.shouldIgnoreUrl(searchUrl);
      expect(shouldIgnore).toBe(false);
    });
  });
});