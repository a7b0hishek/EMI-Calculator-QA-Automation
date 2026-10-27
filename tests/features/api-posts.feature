@api
Feature: JSONPlaceholder POST /posts input boundaries
  As an API consumer
  I want to observe how the posts endpoint handles boundary and invalid request data
  So that I can distinguish service behavior from the assessment's validation expectation

  # A 201 response is checked as JSONPlaceholder's accepted-and-echoed behavior.
  # A meaningful 4xx response is checked as validation behavior. A 5xx or transport error fails.
  Scenario: A post with a 10,000-character title is accepted or meaningfully rejected without a server failure
    Given a POST payload with a 10000-character title and the other required fields
    When I send the POST request to the posts endpoint
    Then the request body matches the intended long-title case
    And the response records how the service handled the payload

  Scenario: A post title with documented unusual symbols is accepted or meaningfully rejected
    Given the following POST payload with unusual title characters:
      """json
      {
        "userId": 7,
        "title": "Boundary characters: ☃ ★ ∑ ∆ ¤ < > & | \\ / \" '",
        "body": "Exercise JSONPlaceholder title handling for documented Unicode and punctuation."
      }
      """
    When I send the POST request to the posts endpoint
    Then the request body matches the intended unusual-character case
    And the response records how the service handled the payload

  Scenario: A post with userId omitted is accepted or meaningfully rejected
    Given the following POST payload with userId omitted:
      """json
      {
        "title": "Missing userId boundary",
        "body": "The userId property is intentionally omitted from this request."
      }
      """
    When I send the POST request to the posts endpoint
    Then the request body matches the intended missing-userId case
    And the response records how the service handled the payload
