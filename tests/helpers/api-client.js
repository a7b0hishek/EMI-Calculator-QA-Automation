import { request } from "playwright";
import { getJsonPlaceholderBaseUrl } from "../support/config.js";

export class ApiClient {
  constructor({ baseURL = getJsonPlaceholderBaseUrl() } = {}) {
    this.baseURL = baseURL;
    this.context = undefined;
  }

  async initialize() {
    if (!this.context) {
      this.context = await request.newContext({ baseURL: this.baseURL });
    }
    return this;
  }

  async createPost(payload, options = {}) {
    return this.post("/posts", payload, options);
  }

  async post(path, payload, options = {}) {
    if (!this.context) {
      throw new Error("Initialize the API client before sending requests.");
    }

    const url = new URL(path, `${this.baseURL}/`).toString();
    this.lastRequest = Object.freeze({
      method: "POST",
      url,
      payload: structuredClone(payload)
    });

    try {
      return await this.context.post(path, { ...options, data: payload });
    } catch (error) {
      throw new Error(`Transport failure during POST ${url}: ${error.message}`, { cause: error });
    }
  }

  async dispose() {
    await this.context?.dispose();
    this.context = undefined;
  }
}
