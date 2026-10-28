# Loan EMI Dashboard

A JavaScript ES-module assessment project with an Express-backed Loan EMI dashboard, Cucumber and Playwright automation, local and external API scenarios, PostgreSQL exercises, and execution evidence.

## Setup and configuration

Requirements: Node.js 20 or newer and npm. From the project root:

```sh
npm install
[ -f .env ] || cp .env.example .env
npx playwright install chromium
```

The copy command preserves an existing `.env`. Configuration keys in `.env.example` are:

- `PORT`: Express port (default `3000`).
- `APP_BASE_URL`: local application base URL used by UI and local API automation.
- `JSONPLACEHOLDER_BASE_URL`: external API base URL, separate from the app URL.
- `BROWSER_HEADLESS`: browser headless mode; defaults to `true`.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: optional Chrome/Chromium executable fallback.

Do not commit `.env` or secrets. The application pages use relative paths and do not hardcode the host or port.

## Run the application

```sh
npm start
```

Open the configured local URL (default `http://localhost:3000`). `npm run start:dev` runs the server with Node's watch mode. `GET /health` returns the app status; unknown paths return JSON 404.

### Application routes

- `GET /` — responsive dashboard with loan amount, annual rate, tenure, EMI estimate, principal/interest chart, and report link.
- `GET /report.html?principal=…&annualRate=…&tenureYears=…` — validates URL inputs and displays a matching repayment report; missing or invalid inputs show an error.
- `POST /api/posts` — deterministic local validation endpoint used by A3 tests.

The EMI calculation converts annual percent to a monthly decimal rate and tenure to months. It uses `P × r × (1 + r)^n / ((1 + r)^n − 1)` for positive rates and `P / n` at zero interest. Loan inputs are bounded and documented in the app; displayed currency is rounded to the nearest paisa.

The local API accepts a JSON object with a positive integer `userId`, non-empty `title`, and non-empty `body`. Titles allow Unicode letters, marks, digits, spaces, and common punctuation, up to 200 Unicode code points. Bodies allow up to 5,000 code points. Valid posts return HTTP 201; validation failures return a JSON error with HTTP 400. Unsupported media types return 415, malformed JSON returns 400, and request bodies over 32 KB return 413. The endpoint is stateless and returns the same sample ID for valid submissions.

## Automation

Cucumber is the test runner; Playwright provides browser automation and API request contexts. UI and API lifecycles are separate. Page Objects live in `tests/pages/`, Gherkin scenarios in `tests/features/`, step definitions in `tests/step-definitions/`, and configuration/hooks/World in `tests/support/`. The test EMI oracle in `tests/helpers/emi-oracle.js` independently verifies the dashboard calculation.

Start the app in one terminal for the suites that exercise the local app, then run from another terminal:

```sh
npm test                       # normal combined suite; excludes @broken-locator
npm run test:ui                # dashboard and report browser scenarios
npm run test:api               # JSONPlaceholder boundary scenarios
npm run test:api:local         # local POST /api/posts validation scenarios
npm run test:broken-locators   # isolated exercise; expected to fail 4 scenarios
```

`npm test` includes UI, external JSONPlaceholder, and local API scenarios. The external service returned HTTP 201 for all three boundary payloads in recorded runs; its acceptance is not validation. The local API suite checks explicit error statuses and messages. The broken-locator feature is intentionally excluded from passing suites and must remain failing for its four incorrect locators.

Cucumber writes readable progress to the terminal and JSON reports under ignored `reports/`. Failure screenshots are also written there. For submission, current reports and screenshots are copied to `docs/evidence/`.

## SQL exercises

The PostgreSQL-dialect schema and fixtures are in `sql/schema.sql`; queries are in `sql/reciprocal-transfers.sql` and `sql/ipl-2024-streaks.sql`. The first uses a self-join for opposite transfers within an inclusive 24-hour window and a directional 10% return-amount comparison. The second aggregates innings by player/match and finds runs of three or more consecutive matches with at least 30 runs each.

Use a dedicated PostgreSQL database:

```sh
createdb streamhub_section_a
psql -X -v ON_ERROR_STOP=1 -d streamhub_section_a -f sql/schema.sql
psql -X -v ON_ERROR_STOP=1 -P pager=off -d streamhub_section_a -f sql/reciprocal-transfers.sql
psql -X -v ON_ERROR_STOP=1 -P pager=off -d streamhub_section_a -f sql/ipl-2024-streaks.sql
```

The IPL fixtures are illustrative sample data, not a complete official season dataset. The scripts were executed using PGlite 0.5.12; native PostgreSQL was unavailable during that verification. See [sql/README.md](sql/README.md) for assumptions, sample results, and limitations.

## Evidence and supporting documents

- [Evidence index](docs/evidence/README.md)
- [Latest default Cucumber report](docs/evidence/test-results/cucumber-default-suite-2026-10-27.json)
- [Latest UI report](docs/evidence/test-results/cucumber-ui-2026-10-27.json)
- [Latest JSONPlaceholder report](docs/evidence/test-results/cucumber-jsonplaceholder-api-2026-10-27.json)
- [Latest local validation API report](docs/evidence/test-results/cucumber-local-validation-api-2026-10-27.json)
- [Intentional broken-locator report](docs/evidence/test-results/cucumber-broken-locators-report.json)
- [Dashboard screenshot](docs/evidence/screenshots/dashboard-current-calculation.png) and [report screenshot](docs/evidence/screenshots/report-current-calculation.png)
- [Reciprocal transfers SQL screenshot](docs/evidence/sql/reciprocal-transfers.png)
- [IPL 2024 streaks SQL screenshot](docs/evidence/sql/ipl-2024-streaks.png)
- [AI locator exercise guide](docs/ai-locator-self-healing.md) and [AI-tool reflection](docs/ai-tool-reflection.md)
<img width="2880" height="1800" alt="Dashboard" src="https://github.com/user-attachments/assets/76ea8093-31c0-47ee-ab34-b3c71b1d790d" />
<img width="1440" height="900" alt="Calculation" src="https://github.com/user-attachments/assets/2be19dd8-c15b-4890-8cf5-e667a84d9e6b" />
<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/ef526a72-52a0-47ac-ab96-adf202a0abc5" />




Latest recorded verification on 2026-10-27: `npm test` passed 23 scenarios/121 steps; `npm run test:ui` passed 9/46; `npm run test:api` passed 3/18; and `npm run test:api:local` passed 11/57. JSONPlaceholder returned HTTP 201 for all three external cases. The SQL outputs matched the five transfer pairs and two sample streaks in PGlite. No real AI model was used for locator repair. See [TRACK_RECORD.md](TRACK_RECORD.md) for check details and setup limitations.

## CodeX Reflection

CodeX assisted with building and reviewing the dashboard and automation framework, organizing Cucumber features, Playwright steps and Page Objects, API validation, SQL exercises, documentation, and evidence. It helped keep the project organized and iterate on issues revealed by actual checks. Setup instructions and repeatable evidence were useful outcomes.

Some work needed environment-specific adjustments: Playwright's browser download was blocked, so installed Google Chrome was used; external API runs needed network access and explicit URL configuration. JSONPlaceholder returned HTTP 201 for all three boundary requests, so a separate local validating API was added. The locator exercise checks deliberately broken selectors and candidate locators but does not perform AI-powered repair. SQL was executed using PGlite, not native PostgreSQL. For the detailed reflection, see [docs/ai-tool-reflection.md](docs/ai-tool-reflection.md).

The project is published at [GitHub](https://github.com/a7b0hishek/EMI-Calculator-QA-Automation). The initial assessment commit was pushed to the `main` branch.
