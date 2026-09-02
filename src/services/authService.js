import keycloak from "../config/keycloak";
import { getApiUrl } from "../utils/envValidator";

export class AuthService {
  constructor() {
    this.baseURL = getApiUrl();
  }

  getAuthHeaders() {
    const token = keycloak.token;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const controller = new AbortController();

    const { timeout, ...fetchOptions } = options;
    const timer = timeout
      ? setTimeout(() => {
          controller.abort(`timeout after ${timeout} ms`);
        }, timeout)
      : null;

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...this.getAuthHeaders(),
          ...fetchOptions.headers,
        },
      });

      const requestId =
        response.headers.get("X-Request-ID") ||
        response.headers.get("x-request-id");

      if (response.status === 401) {
        keycloak.logout({
          redirectUri: window.location.origin,
        });
        const error = new Error("Session expired");
        error.status = 401;
        error.requestId = requestId;
        error.data = null;
        throw error;
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        const errorData = await response.json().catch(() => null);
        if (errorData) {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        error.requestId = requestId;
        error.data = errorData;
        throw error;
      }
      return response;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async get(url) {
    const response = await this.makeAuthenticatedRequest(url);
    return response.json();
  }

  async getBlob(url) {
    const response = await this.makeAuthenticatedRequest(url);
    return response.blob();
  }

  async post(url, data, options = {}) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });

    return response.json();
  }

  async put(url, data) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(url) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: "DELETE",
    });
    return response.json();
  }

  async uploadFile(url, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.makeAuthenticatedRequest(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${keycloak.token}`,
      },
    });
    return response.json();
  }
}

const authService = new AuthService();
export default authService;
