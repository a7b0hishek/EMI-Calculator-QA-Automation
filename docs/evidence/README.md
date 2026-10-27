# Local assessment evidence

These files are copies of real local test and query outputs. The generated originals remain under Git-ignored `reports/`; no output was fabricated. This workspace has no Git repository configured, so these files are prepared for review but have not been staged or pushed.

## Test reports

Fresh execution evidence from 2026-10-27 is preserved under date-stamped names below; older evidence copies remain unchanged.

- `test-results/cucumber-default-suite-2026-10-27.json`: latest `npm test`, **23 scenarios and 121 steps passed** (includes UI, external JSONPlaceholder, and local validation API; excludes the intentionally broken locator feature).
- `test-results/cucumber-ui-2026-10-27.json`: latest UI-only run, **9 scenarios and 46 steps passed**.
- `test-results/cucumber-jsonplaceholder-api-2026-10-27.json`: latest external API run, **3 scenarios and 18 steps passed**. JSONPlaceholder returned HTTP 201 for all three inputs, including invalid cases; this does not demonstrate service-side validation.
- `test-results/cucumber-local-validation-api-2026-10-27.json`: local `/api/posts` validation run, **11 scenarios and 57 steps passed**. The feature assertions cover HTTP 201 for valid boundary payloads, HTTP 400 for validation/malformed JSON, and HTTP 413 for oversized JSON.

- `test-results/cucumber-default-suite-report.json`: 12 scenarios and 64 steps passed.
- `test-results/cucumber-ui-report.json`: 9 scenarios and 46 steps passed.
- `test-results/cucumber-api-report.json`: 3 scenarios and 18 steps passed. JSONPlaceholder returned HTTP 201 for each boundary request, including the invalid payloads; this is service acceptance, not input validation.
- `test-results/cucumber-broken-locators-report.json`: 4 intentionally failing scenarios. The final broken-locator assertion failed in each; robust candidate checks passed. This is expected exercise output, not a regression.

The four failure screenshots are in `screenshots/`. The Cucumber JSON report also contains scenario attachments and failure screenshots.

## Browser screenshots

- `screenshots/dashboard-current-calculation.png` and `screenshots/report-current-calculation.png` were captured with installed Google Chrome from the running local application after calculating a ₹25,00,000 loan at 8.5% for 20 years and opening its report. These are direct browser screenshots, not edited mockups.
- The other four files in `screenshots/` show the four deliberately broken locator exercises. Their expected failures are separate from the passing normal suite.

## SQL query outputs

The screenshots below were captured from live query results executed using temporary PGlite 0.5.12, a PostgreSQL-compatible WASM database. They show 5 transfer pairs and 2 sample streaks. Native PostgreSQL/`psql` was unavailable, and the IPL fixtures are synthetic rather than a complete official dataset.

- [Reciprocal transfers SQL screenshot](sql/reciprocal-transfers.png)
- [IPL 2024 streaks SQL screenshot](sql/ipl-2024-streaks.png)
