@api-local
Feature: Local POST /api/posts validation
  As an API consumer
  I want invalid posts to receive consistent validation errors
  So that request mistakes do not become server failures

  Scenario: A valid post is created
    Given a valid local post payload
    When I submit it to the local posts API
    Then the local API creates the post with HTTP 201
    And the created post fields match the submitted payload

  Scenario: A title at the 200-character limit is accepted
    Given a valid local post payload whose title is exactly 200 characters
    When I submit it to the local posts API
    Then the local API creates the post with HTTP 201
    And the created post fields match the submitted payload

  Scenario: A title longer than 200 characters is rejected
    Given a local post payload whose title is 201 characters long
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "title" containing "at most 200 characters"

  Scenario: A title containing @ is rejected
    Given a local post payload whose title contains @
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "title" containing "unsupported characters"

  Scenario: A post without userId is rejected
    Given a local post payload with userId omitted
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "userId" containing "userId is required"

  Scenario: A post without title is rejected
    Given a local post payload with title omitted
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "title" containing "title is required"

  Scenario: A post without body is rejected
    Given a local post payload with body omitted
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "body" containing "body is required"

  Scenario: A string userId is rejected
    Given a local post payload with a string userId
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "userId" containing "positive integer"

  Scenario: A numeric title is rejected
    Given a local post payload with a numeric title
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON validation error for "title" containing "non-empty string"

  Scenario: Malformed JSON receives a JSON client error
    Given a malformed JSON request body
    When I submit it to the local posts API
    Then the response is an HTTP 400 JSON error with code "INVALID_JSON" and message "Request body must be valid JSON."

  Scenario: A JSON body larger than 32 KB receives a JSON client error
    Given a local post payload whose body exceeds the request size limit
    When I submit it to the local posts API
    Then the response is an HTTP 413 JSON error with code "PAYLOAD_TOO_LARGE" and message "Request body exceeds the 32 KB limit."
