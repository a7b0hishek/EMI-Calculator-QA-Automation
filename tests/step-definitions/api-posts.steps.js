import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";

Given("a POST payload with a {int}-character title and the other required fields", function (titleLength) {
  assert.ok(Number.isInteger(titleLength) && titleLength >= 1, "Title length must be a positive integer");
  this.apiCase = "long-title";
  this.apiPayload = {
    userId: 1,
    title: "L".repeat(titleLength),
    body: "Generated boundary-value payload for the JSONPlaceholder posts endpoint."
  };
});

Given("the following POST payload with unusual title characters:", function (docString) {
  this.apiCase = "unusual-title-characters";
  this.apiPayload = parsePayload(docString);
});

Given("the following POST payload with userId omitted:", function (docString) {
  this.apiCase = "missing-userId";
  this.apiPayload = parsePayload(docString);
});

When("I send the POST request to the posts endpoint", async function () {
  const response = await this.apiClient.createPost(this.apiPayload);
  const responseText = await response.text();
  let responseBody = responseText;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    // Preserve non-JSON bodies so the response can be reported and diagnosed.
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

Then("the request body matches the intended long-title case", function () {
  assertRequestMatchesPayload(this);
  assert.equal(this.apiPayload.title.length, 10_000, "The submitted title must contain exactly 10,000 characters");
  assert.deepEqual(Object.keys(this.apiPayload).sort(), ["body", "title", "userId"]);
  assert.equal(this.apiPayload.userId, 1);
});

Then("the request body matches the intended unusual-character case", function () {
  assertRequestMatchesPayload(this);
  for (const character of ["☃", "★", "∑", "∆", "¤", "<", ">", "&", "|", "\\", "/", '"', "'"]) {
    assert.ok(this.apiPayload.title.includes(character), `Expected title to include ${JSON.stringify(character)}`);
  }
  assert.equal(this.apiPayload.userId, 7);
});

Then("the request body matches the intended missing-userId case", function () {
  assertRequestMatchesPayload(this);
  assert.equal(Object.hasOwn(this.apiPayload, "userId"), false, "userId must be omitted, not null or empty");
  assert.deepEqual(Object.keys(this.apiPayload).sort(), ["body", "title"]);
});

Then("the response records how the service handled the payload", function () {
  const { status, body, headers } = this.apiResponse;
  assert.ok(Number.isInteger(status), "An HTTP response status must be present");
  assert.ok(status < 500, `The endpoint returned a server failure (${status})`);

  if (status === 201) {
    assert.ok(body && typeof body === "object" && !Array.isArray(body), "A 201 response should contain a JSON post object");
    for (const [key, value] of Object.entries(this.apiPayload)) {
      assert.deepEqual(body[key], value, `The created post should echo request field ${key}`);
    }
    assert.ok(Object.hasOwn(body, "id"), "A created post response should include its generated id");
    assert.match(headers["content-type"] ?? "", /application\/json/i, "The successful response should be JSON");
    if (this.apiCase === "missing-userId") {
      assert.equal(Object.hasOwn(body, "userId"), false, "The response should not invent the omitted userId");
    }
    this.log("Observed service behavior: HTTP 201 accepted and echoed this payload. This does not satisfy the assessment's desired validation rejection.");
    return;
  }

  assert.ok(status >= 400 && status < 500, `Expected HTTP 201 acceptance or a 4xx validation response; received ${status}`);
  const errorDescription = typeof body === "string" ? body.trim() : findErrorDescription(body);
  assert.ok(errorDescription, `The ${status} response should include a non-empty validation error description`);
  assert.match(
    errorDescription,
    validationPatternFor(this.apiCase),
    `The ${status} error should identify a validation issue relevant to ${this.apiCase}`
  );
  this.log(`Observed service behavior: HTTP ${status} returned a validation error: ${errorDescription}`);
});

function parsePayload(docString) {
  let payload;
  try {
    payload = JSON.parse(docString);
  } catch (error) {
    throw new Error(`The scenario POST payload is not valid JSON: ${error.message}`, { cause: error });
  }
  assert.ok(payload && typeof payload === "object" && !Array.isArray(payload), "POST payload must be a JSON object");
  return payload;
}

function assertRequestMatchesPayload(world) {
  assert.equal(world.apiClient.lastRequest?.method, "POST");
  assert.match(world.apiClient.lastRequest?.url ?? "", /\/posts$/);
  assert.deepEqual(world.apiClient.lastRequest?.payload, world.apiPayload, "The API client must send the scenario's exact payload");
}

function findErrorDescription(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  for (const key of ["message", "error", "errors", "detail", "title"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length > 0) return JSON.stringify(value);
    if (value && typeof value === "object" && Object.keys(value).length > 0) return JSON.stringify(value);
  }
  return "";
}

function validationPatternFor(apiCase) {
  const patterns = {
    "long-title": /validation|invalid|title|length|long|maximum|limit/i,
    "unusual-title-characters": /validation|invalid|title|character|symbol|special|unsupported/i,
    "missing-userId": /validation|required|user.?id|missing|field/i
  };
  const pattern = patterns[apiCase];
  assert.ok(pattern, `No validation-response assertion is defined for API case ${apiCase}`);
  return pattern;
}
