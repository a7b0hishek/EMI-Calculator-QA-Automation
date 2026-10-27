import { Router } from "express";

export const MAX_POST_TITLE_LENGTH = 200;
export const MAX_POST_BODY_LENGTH = 5_000;

const router = Router();
const supportedTitleCharacters = /^[\p{L}\p{M}\p{N} .,!?():;'-]+$/u;

router.post("/", (request, response) => {
  if (!request.is("application/json")) {
    return sendError(response, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
  }

  const payload = request.body;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return sendError(response, 400, "INVALID_BODY", "Request body must be a JSON object.");
  }

  if (!Object.hasOwn(payload, "userId")) {
    return sendValidationError(response, "userId", "userId is required.");
  }
  if (!Number.isInteger(payload.userId) || payload.userId < 1) {
    return sendValidationError(response, "userId", "userId must be a positive integer.");
  }

  if (!Object.hasOwn(payload, "title")) {
    return sendValidationError(response, "title", "title is required.");
  }
  if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
    return sendValidationError(response, "title", "title must be a non-empty string.");
  }

  const titleLength = Array.from(payload.title).length;
  if (titleLength > MAX_POST_TITLE_LENGTH) {
    return sendValidationError(response, "title", `title must be at most ${MAX_POST_TITLE_LENGTH} characters.`);
  }
  if (!supportedTitleCharacters.test(payload.title)) {
    return sendValidationError(response, "title", "title contains unsupported characters.");
  }

  if (!Object.hasOwn(payload, "body")) {
    return sendValidationError(response, "body", "body is required.");
  }
  if (typeof payload.body !== "string" || payload.body.trim().length === 0) {
    return sendValidationError(response, "body", "body must be a non-empty string.");
  }
  if (Array.from(payload.body).length > MAX_POST_BODY_LENGTH) {
    return sendValidationError(response, "body", `body must be at most ${MAX_POST_BODY_LENGTH} characters.`);
  }

  // This local assessment endpoint is intentionally stateless and deterministic.
  return response.status(201).json({
    id: 1,
    userId: payload.userId,
    title: payload.title,
    body: payload.body
  });
});

function sendValidationError(response, field, message) {
  return response.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      field,
      message
    }
  });
}

function sendError(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}

export default router;
