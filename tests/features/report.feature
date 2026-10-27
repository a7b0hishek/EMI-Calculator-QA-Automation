@ui
Feature: Loan repayment report
  As a borrower
  I want to review the details behind my EMI estimate
  So that I can confirm the submitted loan inputs and repayment totals

  Scenario: Report displays the submitted loan inputs and calculated results
    Given the loan dashboard is open
    When I calculate a loan of 2500000 INR at 8.5% for 20 years
    And I open repayment details
    Then the report shows the submitted loan inputs and independent calculation

  Scenario: Report navigation returns to the dashboard
    Given the loan dashboard is open
    When I calculate a loan of 2500000 INR at 8.5% for 20 years
    And I open repayment details
    And I return to the calculator from the report
    Then the loan dashboard is visible again

  Scenario: Missing report query parameters show an error
    Given the report is opened without loan query parameters
    Then the report shows a clear error instead of calculated results

  Scenario: Invalid report query parameters show an error
    Given the report is opened with invalid loan parameters
    Then the report shows a clear error instead of calculated results
