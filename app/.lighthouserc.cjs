module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173'],
      startServerCommand: 'npm run dev:e2e',
      startServerReadyPattern: 'ready|Local:|Network:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 1,
      settings: {
        // Wait for page to be fully interactive
        waitForSelector: 'body',
        waitForSelectorTimeout: 10000,
        // Skip some audits that may not be relevant in dev mode
        skipAudits: ['uses-http2', 'uses-long-cache-ttl']
      }
    },
    assert: {
      assertions: {
        // Lower thresholds for development environment
        // These should be increased for production builds
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}

