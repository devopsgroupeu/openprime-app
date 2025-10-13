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
    try {
      // Ensure token is fresh before making request
      await keycloak.updateToken(30);

      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        mode: "cors",
        credentials: "include",
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized: Token may be invalid or expired");
        keycloak.logout();
        throw new Error("Session expired");
      }

      if (response.status === 503) {
        console.error("Service Unavailable: Backend service is not responding");
        throw new Error("Service temporarily unavailable. Please try again later.");
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unable to read error response");
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async makeAuthenticatedRequestJava(url, options = {}) {
    try {
      // Ensure token is fresh before making request
      await keycloak.updateToken(30);

      const response = await fetch(`https://app.openprime.io/api${url}`, {
        ...options,
        mode: "cors",
        credentials: "include",
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        console.error("Unauthorized: Token may be invalid or expired");
        keycloak.logout();
        throw new Error("Session expired");
      }

      if (response.status === 403) {
        console.error("Forbidden: User does not have required permissions");
        throw new Error("Access denied: Insufficient permissions");
      }

      if (response.status === 503) {
        console.error("Service Unavailable: Backend service is not responding");
        throw new Error("Service temporarily unavailable. Please try again later.");
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unable to read error response");
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Java API request failed:", error);
      throw error;
    }
  }

  async get(url) {
    const response = await this.makeAuthenticatedRequest(url);
    return response.json();
  }

  async post(url, data) {
    const response = await this.makeAuthenticatedRequest(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  }
  async postJava(url, data) {
    const response = await this.makeAuthenticatedRequestJava(url, {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async getJava(url) {
    const response = await this.makeAuthenticatedRequestJava(url);
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async putJava(url, data) {
    const response = await this.makeAuthenticatedRequestJava(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async deleteJava(url) {
    const response = await this.makeAuthenticatedRequestJava(url, {
      method: "DELETE",
    });
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
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
