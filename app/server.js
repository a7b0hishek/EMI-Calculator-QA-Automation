import "dotenv/config";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postsRouter from "./api/posts.js";

const app = express();
const appDirectory = dirname(fileURLToPath(import.meta.url));
const publicDirectory = resolve(appDirectory, "public");
const chartDistributionDirectory = resolve(
  appDirectory,
  "../node_modules/chart.js/dist"
);

const configuredPort = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.use(express.json({ limit: "32kb", strict: true }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    application: "streamhub-loan-emi-dashboard"
  });
});

app.use("/api/posts", postsRouter);

// Serve the installed Chart.js browser bundle locally, without relying on a CDN.
app.use("/vendor", express.static(chartDistributionDirectory));
app.use(express.static(publicDirectory));

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

app.use((error, _request, response, next) => {
  if (response.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must be valid JSON." }
    });
  }
  if (error.type === "entity.too.large") {
    return response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the 32 KB limit." }
    });
  }

  return response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." }
  });
});

app.listen(configuredPort, "0.0.0.0", () => {
  console.log(`Loan EMI Dashboard listening on port ${configuredPort}`);
});
