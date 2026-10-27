@broken-locator
Feature: Isolated intentionally broken locator exercise
  These scenarios are expected to fail at the final assertion because the
  deliberately incorrect locator resolves to zero elements. The preceding step
  validates the robust candidate against the real dashboard markup.

  Background:
    Given the loan dashboard is open for the locator exercise

  Scenario: An invented heading class cannot find the dashboard heading
    When I inspect the intentionally broken locator for "dashboard heading"
    Then the intentionally broken locator for "dashboard heading" resolves to exactly one element

  Scenario: Incorrect input ID casing cannot find the loan amount field
    When I inspect the intentionally broken locator for "loan amount input"
    Then the intentionally broken locator for "loan amount input" resolves to exactly one element

  Scenario: An invented button class cannot find the calculate button
    When I inspect the intentionally broken locator for "calculate button"
    Then the intentionally broken locator for "calculate button" resolves to exactly one element

  Scenario: An incorrect canvas ID cannot find the chart canvas
    When I inspect the intentionally broken locator for "repayment chart"
    Then the intentionally broken locator for "repayment chart" resolves to exactly one element
