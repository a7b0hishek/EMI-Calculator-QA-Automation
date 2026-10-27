import "dotenv/config";

function readHttpUrl(variableName) {
  const value = process.env[variableName]?.trim();
  if (!value) {
    throw new Error(`Set ${variableName} in the environment or .env before running this scenario.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid HTTP or HTTPS URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${variableName} must use HTTP or HTTPS.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

export function getAppBaseUrl() {
  return readHttpUrl("APP_BASE_URL");
}

export function getJsonPlaceholderBaseUrl() {
  return readHttpUrl("JSONPLACEHOLDER_BASE_URL");
}

export function isBrowserHeadless() {
  return (process.env.BROWSER_HEADLESS ?? "true").trim().toLowerCase() !== "false";
}

export function getBrowserLaunchOptions() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  return {
    headless: isBrowserHeadless(),
    ...(executablePath ? { executablePath } : {})
  };
}
