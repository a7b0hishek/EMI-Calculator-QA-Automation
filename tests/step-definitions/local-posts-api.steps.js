import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";

Given("a valid local post payload", function () {
  this.apiPayload = {
    userId: 7,
    title: "Home loan consultation",
    body: "Please contact me about repayment options."
  };
});

Given("a valid local post payload whose title is exactly 200 characters", function () {
  this.apiPayload = {
    userId: 7,
    title: "A".repeat(200),
    body: "The title length is at the documented inclusive limit."
  };
});

Given("a local post payload whose title is {int} characters long", function (length) {
  this.apiPayload = {
    userId: 7,
    title: "A".repeat(length),
    body: "This title exceeds the documented limit."
  };
});

Given("a local post payload whose title contains an unsupported symbol", function () {
  this.apiPayload = {
    userId: 7,
    title: "Loan estimate ☃",
    body: "The snowman symbol is outside the title character allowlist."
  };
});

Given("a local post payload with userId omitted", function () {
  this.apiPayload = { title: "Missing userId", body: "This request has no userId property." };
});

Given("a local post payload with title omitted", function () {
  this.apiPayload = { userId: 7, body: "This request has no title property." };
});

Given("a local post payload with body omitted", function () {
  this.apiPayload = { userId: 7, title: "Missing body" };
});

Given("a local post payload with a string userId", function () {
  this.apiPayload = { userId: "7", title: "String userId", body: "The userId has the wrong JSON type." };
});

Given("a local post payload with a numeric title", function () {
  this.apiPayload = { userId: 7, title: 123, body: "The title has the wrong JSON type." };
});

Given("a malformed JSON request body", function () {
  this.apiPayload = "{\"userId\":7,\"title\":";
  this.apiRequestOptions = { headers: { "content-type": "application/json" } };
});

Given("a local post payload whose body exceeds the request size limit", function () {
  this.apiPayload = { userId: 7, title: "Large request", body: "x".repeat(33_000) };
});

When("I submit it to the local posts API", async function () {
  const response = await this.apiClient.post("/api/posts", this.apiPayload, this.apiRequestOptions);
  const responseText = await response.text();
  let responseBody = responseText;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    // Keep non-JSON responses visible in the report so the assertion can fail clearly.
  }

  this.apiResponse = {
    status: response.status(),
    headers: response.headers(),
    body: responseBody
  };

  await this.attach(JSON.stringify({
    request: this.apiClient.lastRequest,
    response: this.apiResponse
  }, null, 2), "application/json");
});

Then("the local API creates the post with HTTP {int}", function (expectedStatus) {
  assert.equal(this.apiResponse.status, expectedStatus);
  assert.equal(expectedStatus, 201);
  assert.match(this.apiResponse.headers["content-type"] ?? "", /application\/json/i);
});

Then("the created post fields match the submitted payload", function () {
  assert.deepEqual(this.apiResponse.body, {
    id: 1,
    userId: this.apiPayload.userId,
    title: this.apiPayload.title,
    body: this.apiPayload.body
  });
});

Then("the response is an HTTP {int} JSON validation error for {string} containing {string}", function (status, field, messagePart) {
  assert.equal(this.apiResponse.status, status);
  assert.equal(status, 400, "Ordinary request validation must not become a server error");
  assert.match(this.apiResponse.headers["content-type"] ?? "", /application\/json/i);
  assert.deepEqual(this.apiResponse.body, {
    error: {
      code: "VALIDATION_ERROR",
      field,
      message: this.apiResponse.body?.error?.message
    }
  });
  assert.equal(typeof this.apiResponse.body.error.message, "string");
  assert.ok(this.apiResponse.body.error.message.includes(messagePart));
});

Then("the response is an HTTP {int} JSON error with code {string} and message {string}", function (status, code, message) {
  assert.equal(this.apiResponse.status, status);
  assert.ok([400, 413].includes(status));
  assert.match(this.apiResponse.headers["content-type"] ?? "", /application\/json/i);
  assert.deepEqual(this.apiResponse.body, { error: { code, message } });
});
