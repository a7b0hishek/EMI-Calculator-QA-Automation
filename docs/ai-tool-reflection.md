# AI coding assistant reflection

## How I used the assistant

I used an AI coding assistant to help interpret the assessment, plan the project structure, implement the Loan EMI dashboard and report, build the Playwright/Cucumber foundation, draft UI and API scenarios, write PostgreSQL exercises, and prepare the isolated locator exercise and documentation. I supplied the requirements, reference design, constraints, and existing project context, and repeatedly directed the work to inspect and preserve the files already in place.

The assistant generated and edited code and documentation, but its output needed review and iteration. For example, a PostgreSQL query initially used a reserved word as an alias; execution in PGlite exposed the syntax error, and the query was corrected and rerun. Earlier UI checks also exposed a mismatched report selector, which was corrected before the UI suite passed. These are examples of why generated code should not be treated as correct without execution and inspection.

## How I checked the work

The recorded local checks include JavaScript syntax and dependency/lockfile consistency checks; the default Cucumber suite (12 scenarios, 64 steps), UI suite (9 scenarios, 46 steps), and API suite (3 scenarios, 18 steps); and execution of both SQL scripts against PGlite. The four broken-locator scenarios intentionally fail their final assertions after their robust locator candidates are checked. Their expected failures are kept out of the normal passing suites.

The API test evidence showed JSONPlaceholder returning HTTP 201 for all three boundary payloads. That result is documented as service acceptance, not as validation. SQL execution used PGlite because native PostgreSQL and `psql` were unavailable; the SQL is documented as PostgreSQL dialect, and a native-server run remains a separate check.

## AI and the locator exercise

No real AI model or paid AI API was connected to the test framework, and no model performed automatic locator repair. The locator task is a simulated detection exercise: each intentionally incorrect selector is counted as zero matches, a robust candidate is verified against the current page, and a final assertion records the intentional failure. The guide includes a prompt that could be used with an AI assistant, along with human validation steps; it is a documented workflow, not an integrated feature.

## Takeaway

The assistant was useful for producing a first implementation and organizing repetitive test and documentation work. The checks and corrections above show its output still required review against the real markup, API responses, SQL runtime, and assessment requirements. I kept the expected locator failures visible, documented the external-service and database limitations, and did not claim that AI self-healing was implemented. The reports and screenshots are local evidence; no Git repository or remote has been configured and nothing has been pushed.
