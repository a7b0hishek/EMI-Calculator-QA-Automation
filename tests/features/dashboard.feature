@ui
Feature: Loan EMI dashboard
  As a borrower
  I want to calculate a loan EMI from the dashboard
  So that I can understand the monthly and total repayment amounts

  Scenario: Dashboard loads with the expected heading and loan controls
    Given the loan dashboard is open
    Then the dashboard heading and loan controls are visible

  Scenario: A positive-interest loan displays independently calculated figures
    Given the loan dashboard is open
    When I calculate a loan of 2500000 INR at 8.5% for 20 years
    Then the displayed loan figures match the independent calculation

  Scenario: A zero-interest loan is calculated correctly
    Given the loan dashboard is open
    When I calculate a loan of 120000 INR at 0% for 1 year
    Then the displayed loan figures match the independent calculation

  Scenario: The chart shows positive principal and interest values
    Given the loan dashboard is open
    When I calculate a loan of 2500000 INR at 8.5% for 20 years
    Then the chart is visible and its principal and interest values are positive

  Scenario: Missing input feedback clears the previous calculation and chart summary
    Given the loan dashboard is open
    When I calculate a loan of 2500000 INR at 8.5% for 20 years
    And I clear the loan amount and calculate again
    Then validation feedback is shown and stale results are cleared
