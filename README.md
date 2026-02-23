

sanity done incogniot
posthog

Admin dashboard for course management and user analytics

E2E tests (Playwright or Cypress) covering critical flows

Community/forum section with discussion threads and Q&A

Onboarding flow with skill assessment quiz

PWA support (installable, offline-capable)

Advanced gamification (daily challenges, seasonal events)

CMS Course creator dashboard

Actual integration with devnet program


  # Run all e2e tests (starts dev server automatically)                                                                                                         
  cd lms && npx playwright test                                                                                                                                                                                                                                                                                                 
  # Or via package.json script                                                                                                                                  
  cd lms && pnpm test:e2e

  # Run a specific test file
  npx playwright test landing

  # Run with UI mode (interactive)
  npx playwright test --ui

  # Run headed (see the browser)
  npx playwright test --headed

  # View last test report
  npx playwright show-report
