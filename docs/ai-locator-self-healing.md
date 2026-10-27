# AI-assisted locator self-healing exercise

This exercise uses four deliberately incorrect locators in `tests/step-definitions/intentional-broken-locators.steps.js`. They are isolated in `tests/features/intentional-broken-locators.feature`, tagged `@broken-locator`, and are excluded from the default, UI, and API suites. This is a **simulated locator-detection exercise**: the step counts the bad locator's matches (zero), validates a robust candidate, and a final assertion intentionally fails because the bad locator did not match. It does not induce a Playwright action timeout/strict-mode error and does not automatically repair the selector. No real AI model is called.

## The four examples

| Intended target | Deliberately broken locator | Why it fails | Robust candidate |
|---|---|---|---|
| Dashboard `h1#page-title` | `.hero-title` | The actual heading has no `hero-title` class. | `getByRole("heading", { level: 1, name: /Know your EMI\.\s*Own your next move\./ })` |
| Loan amount numeric input | `#loanAmount` | The actual ID is lowercase with a hyphen: `loan-amount`. | `getByRole("spinbutton", { name: "Loan amount (INR)" })` |
| Calculate EMI submit button | `button.submit-loan` | No `submit-loan` class exists; the button is identified by its accessible name and stable test ID. | `getByRole("button", { name: "Calculate EMI" })` |
| Repayment chart canvas | `#emi-chart` | The actual canvas ID is `repayment-chart`. | `getByTestId("chart-container").getByRole("img", { name: /No chart data/ })` |

The targets and robust candidates were selected from the current `app/public/index.html`, `app/public/css/styles.css`, and `app/public/js/dashboard.js`. The broken selectors are used only by this exercise; normal Page Objects and application markup are unchanged.

## Detection

Playwright reports locator failures through zero matches, strict-mode errors for multiple matches, or timeouts while waiting for a match to become visible/actionable. Review the exact locator, operation, timeout, and call log. A failure screenshot and the Cucumber attachment containing the intended element's live `outerHTML` can help establish what was actually rendered. Capture relevant DOM evidence from the same page and state as the failed action.

Before changing a selector, check whether the intended element is present and visible, whether navigation or calculation completed, whether an overlay or validation state blocks interaction, and whether the accessible role/name or label changed. If the intended element is absent or its behavior/content changed, investigate an application regression; changing the locator would conceal it. In this exercise, the step first checks the candidate against the actual page, then records that each deliberately bad selector matched zero elements.

## Example AI prompt

Provide the failing locator, Playwright error, relevant markup, and what the test intends to interact with. For example:

```text
You are reviewing a Playwright locator failure. Propose a locator repair only; do not edit files.

Failing locator: page.locator("#loanAmount")
Error: locator resolved to 0 elements
Intended element: the visible numeric input labelled "Loan amount (INR)"
Relevant live HTML:
<label for="loan-amount">Loan amount <span class="field-unit">(INR)</span></label>
<input id="loan-amount" name="loanAmount" type="number" data-testid="loan-amount">

Suggest the most resilient Playwright locator, preferably using getByLabel,
getByRole, getByText, or an existing stable data-testid. Explain why it matches
the intended element and note any ambiguity. Do not invent elements, attributes,
labels, or application behavior. If this evidence is insufficient, ask for more
DOM or accessibility evidence instead of guessing.
```

Treat AI output as a proposal. An AI assistant has no authority to silently alter a Page Object or weaken an assertion.

## Validate before applying a repair

1. Confirm the application is in the expected route and state, and inspect current markup/accessibility evidence.
2. Check that the proposed locator resolves to exactly one element. Verify the match has the intended role, accessible name/label, text, or stable test ID. The exercise's `When` step performs this uniqueness and target check for its candidate locators.
3. Apply a reviewed repair locally, then run the targeted scenario. For a real repair, it should pass because the intended element is present and the interaction/assertion remains intact.
4. Run the relevant regression suite (`npm run test:ui`, and `npm run test:api` if shared framework code changed). The normal suites exclude `@broken-locator`.
5. Review the diff to ensure only the intended locator changed and that assertions were not removed, loosened, or replaced with “element exists” checks that miss the behavior under test.

## Limitations and safeguards

- AI suggestions may be wrong, ambiguous, or overly broad. A locator that matches several elements is not a successful repair.
- A locator failure can reveal a real application defect, changed accessible behavior, a blocked interaction, or a race—not just stale test code.
- Automatic healing can hide UI regressions or weaken test intent. Do not silently accept runtime selector substitution or update production Page Objects without review and regression validation.
- The current project does not configure or call a real AI model. This document describes a human-reviewed workflow; it does not claim model integration.

## Run this exercise

```sh
npm start
```

In another terminal, run:

```sh
npm run test:broken-locators
```

The command is expected to exit nonzero with four locator assertion failures; this is the demonstration result, not a passing product suite. Its working JSON report is `reports/cucumber-broken-locators-report.json`, and failure screenshots are written under `reports/screenshots/`. Routine generated artifacts remain ignored by Git. Selected reports and genuine screenshots have copies under `docs/evidence/test-results/` and `docs/evidence/screenshots/` for later staging. The default `npm test`/`npm run test:cucumber`, UI, and API commands exclude this exercise.
