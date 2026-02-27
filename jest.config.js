module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',

  // Extensions de fichiers à considérer
  moduleFileExtensions: ['js', 'json'],

  // Patterns pour trouver les tests
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],

  // Setup pour simuler les APIs Chrome
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Couverture de code
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },

  // Transformation des fichiers
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Mock des ressources statiques
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/test/__mocks__/fileMock.js'
  },

  // Variables d'environnement pour les tests
  globals: {
    'chrome': {}
  },

  // Ignore des dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Verbose output
  verbose: true,

  // Clear mocks entre les tests
  clearMocks: true,

  // Répertoire de cache
  cacheDirectory: '<rootDir>/.jest-cache'
};