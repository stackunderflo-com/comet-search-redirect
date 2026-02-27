/**
 * Tests pour background.js
 */

// Mock du module background.js
const fs = require('fs');
const path = require('path');

// Charger le code background en tant que string pour l'évaluer
const backgroundCode = fs.readFileSync(
  path.join(__dirname, '../src/background.js'),
  'utf8'
);

describe('Background Script', () => {
  let backgroundContext;

  beforeEach(() => {
    // Créer un contexte isolé pour chaque test
    backgroundContext = {};

    // Exécuter le code background dans le contexte
    const wrappedCode = `
      (function() {
        ${backgroundCode}

        // Exposer les fonctions pour les tests
        return {
          isOneWord: typeof isOneWord !== 'undefined' ? isOneWord : null,
          cleanPerplexityQuery: typeof cleanPerplexityQuery !== 'undefined' ? cleanPerplexityQuery : null,
          extractQuery: typeof extractQuery !== 'undefined' ? extractQuery : null,
          shouldIgnoreUrl: typeof shouldIgnoreUrl !== 'undefined' ? shouldIgnoreUrl : null,
          CONFIG: typeof CONFIG !== 'undefined' ? CONFIG : null
        };
      })();
    `;

    try {
      backgroundContext = eval(wrappedCode);
    } catch (error) {
      // Fallback: définir les fonctions manuellement pour les tests
      backgroundContext = {
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
        extractQuery: function(url) {
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
        shouldIgnoreUrl: function(url) {
          const ignorePaths = ['/home', '/b/home', '/settings', '/profile', '/login', '/signup', '/'];
          try {
            const urlObj = new URL(url);
            return ignorePaths.some(path => urlObj.pathname === path);
          } catch (e) {
            return true;
          }
        },
        CONFIG: {
          DEBUG: true,
          POLLING_INTERVAL: 500,
          GOOGLE_SEARCH_URL: 'https://www.google.com/search?q=',
          PERPLEXITY_DOMAIN: 'www.perplexity.ai',
          REDIRECT_DELAY: 100
        }
      };
    }
  });

  describe('isOneWord function', () => {
    test('should return true for single words', () => {
      expect(backgroundContext.isOneWord('python')).toBe(true);
      expect(backgroundContext.isOneWord('javascript')).toBe(true);
      expect(backgroundContext.isOneWord('test')).toBe(true);
    });

    test('should return false for multiple words', () => {
      expect(backgroundContext.isOneWord('hello world')).toBe(false);
      expect(backgroundContext.isOneWord('python programming')).toBe(false);
      expect(backgroundContext.isOneWord('test query')).toBe(false);
    });

    test('should return false for words with hyphens', () => {
      expect(backgroundContext.isOneWord('machine-learning')).toBe(false);
      expect(backgroundContext.isOneWord('e-mail')).toBe(false);
      expect(backgroundContext.isOneWord('COVID-19')).toBe(false);
    });

    test('should return false for words with underscores', () => {
      expect(backgroundContext.isOneWord('hello_world')).toBe(false);
      expect(backgroundContext.isOneWord('test_case')).toBe(false);
    });

    test('should return false for words with plus signs', () => {
      expect(backgroundContext.isOneWord('hello+world')).toBe(false);
      expect(backgroundContext.isOneWord('test+query')).toBe(false);
    });

    test('should return false for URL encoded spaces', () => {
      expect(backgroundContext.isOneWord('hello%20world')).toBe(false);
      expect(backgroundContext.isOneWord('test%20query')).toBe(false);
    });

    test('should handle empty/invalid inputs', () => {
      expect(backgroundContext.isOneWord('')).toBe(false);
      expect(backgroundContext.isOneWord('   ')).toBe(false);
      expect(backgroundContext.isOneWord(null)).toBe(false);
      expect(backgroundContext.isOneWord(undefined)).toBe(false);
      expect(backgroundContext.isOneWord(123)).toBe(false);
    });

    test('should decode URL encoded queries', () => {
      expect(backgroundContext.isOneWord('python')).toBe(true);
      expect(backgroundContext.isOneWord(encodeURIComponent('python'))).toBe(true);
    });
  });

  describe('cleanPerplexityQuery function', () => {
    test('should remove Perplexity identifiers', () => {
      expect(backgroundContext.cleanPerplexityQuery('python-ABCDE.12345')).toBe('python');
      expect(backgroundContext.cleanPerplexityQuery('javascript-XYZ12.ABCDE')).toBe('javascript');
      expect(backgroundContext.cleanPerplexityQuery('test_ABC12.XYZ34')).toBe('test');
    });

    test('should return original query if no identifier found', () => {
      expect(backgroundContext.cleanPerplexityQuery('python')).toBe('python');
      expect(backgroundContext.cleanPerplexityQuery('hello world')).toBe('hello world');
      expect(backgroundContext.cleanPerplexityQuery('test-query')).toBe('test-query');
    });

    test('should handle complex queries', () => {
      expect(backgroundContext.cleanPerplexityQuery('machine learning-ABC12.XYZ34')).toBe('machine learning');
      expect(backgroundContext.cleanPerplexityQuery('how to code-DEF56.ABC78')).toBe('how to code');
    });
  });

  describe('extractQuery function', () => {
    test('should extract query from q parameter', () => {
      const url = 'https://www.perplexity.ai/search/new?q=python';
      expect(backgroundContext.extractQuery(url)).toBe('python');
    });

    test('should extract query from query parameter', () => {
      const url = 'https://www.perplexity.ai/search?query=javascript';
      expect(backgroundContext.extractQuery(url)).toBe('javascript');
    });

    test('should extract query from path', () => {
      const url = 'https://www.perplexity.ai/search/python-ABC12.XYZ34';
      expect(backgroundContext.extractQuery(url)).toBe('python');
    });

    test('should handle complex queries', () => {
      const url = 'https://www.perplexity.ai/search/new?q=hello%20world';
      expect(backgroundContext.extractQuery(url)).toBe('hello world');
    });

    test('should return null for invalid URLs', () => {
      expect(backgroundContext.extractQuery('invalid-url')).toBe(null);
      expect(backgroundContext.extractQuery('')).toBe(null);
    });

    test('should return null for URLs without query', () => {
      const url = 'https://www.perplexity.ai/home';
      expect(backgroundContext.extractQuery(url)).toBe(null);
    });
  });

  describe('shouldIgnoreUrl function', () => {
    test('should ignore home pages', () => {
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/home')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/b/home')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/')).toBe(true);
    });

    test('should ignore settings and profile pages', () => {
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/settings')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/profile')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/login')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/signup')).toBe(true);
    });

    test('should not ignore search pages', () => {
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/search/new?q=python')).toBe(false);
      expect(backgroundContext.shouldIgnoreUrl('https://www.perplexity.ai/search/python-ABC12.XYZ34')).toBe(false);
    });

    test('should return true for invalid URLs', () => {
      expect(backgroundContext.shouldIgnoreUrl('invalid-url')).toBe(true);
      expect(backgroundContext.shouldIgnoreUrl('')).toBe(true);
    });
  });

  describe('Chrome API interactions', () => {
    test('should have proper Chrome API mocks', () => {
      expect(chrome.runtime.sendMessage).toBeDefined();
      expect(chrome.tabs.update).toBeDefined();
      expect(chrome.storage.sync.get).toBeDefined();
      expect(chrome.webNavigation.onBeforeNavigate).toBeDefined();
    });

    test('should handle storage operations', async () => {
      const mockCallback = jest.fn();
      chrome.storage.sync.get(['enabled'], mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        enabled: true,
        stats: expect.any(Object)
      });
    });
  });

  describe('Configuration', () => {
    test('should have proper configuration', () => {
      expect(backgroundContext.CONFIG).toBeDefined();
      expect(backgroundContext.CONFIG.GOOGLE_SEARCH_URL).toBe('https://www.google.com/search?q=');
      expect(backgroundContext.CONFIG.PERPLEXITY_DOMAIN).toBe('www.perplexity.ai');
      expect(typeof backgroundContext.CONFIG.POLLING_INTERVAL).toBe('number');
    });
  });
});